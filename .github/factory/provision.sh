#!/usr/bin/env bash
# Board as code: make the Project's Status options match factory.yml.
# Keeps option ids (matched by name or `was`), so renames never move cards. Never deletes an option.
set -euo pipefail

CFG="${FACTORY_CONFIG:-.github/factory/factory.yml}"
OWNER="${GITHUB_REPOSITORY%%/*}"
PN="${FACTORY_PROJECT:-$(yq '.project' "$CFG")}"
WANT=$(yq -o=json '.board.columns' "$CFG")

F=$(gh api graphql -f query='query($o:String!,$n:Int!){ user(login:$o){ projectV2(number:$n){
  field(name:"Status"){ ... on ProjectV2SingleSelectField{ id options{ id name color description } } } } } }' \
  -f o="$OWNER" -F n="$PN" --jq '.data.user.projectV2.field')
FID=$(jq -r .id <<<"$F")

# desired list: config columns (reusing matching ids), then any unmanaged leftovers
NEXT=$(jq -n --argjson want "$WANT" --argjson have "$(jq .options <<<"$F")" '
  def key: ascii_downcase;
  [ $want[] as $c
    | ([$c.name] + ($c.was // []) | map(key)) as $names
    | ($have | map(select(.name | key | IN($names[]))) | first) as $hit
    | {name: $c.name, color: $c.color, description: ""} + (if $hit then {id: $hit.id} else {} end) ] as $cols
  | $cols + [ $have[] | select(.id as $i | $cols | map(.id) | index($i) | not)
              | {id, name, color, description: (.description // "")} ]')

if jq -e --argjson have "$(jq .options <<<"$F")" \
  '[.[] | {name, color}] == [$have[] | {name, color}]' <<<"$NEXT" >/dev/null; then
  echo "[provision] board matches config"; exit 0
fi

jq -n --arg f "$FID" --argjson o "$NEXT" '{query: "mutation($f:ID!,$o:[ProjectV2SingleSelectFieldOptionInput!]!){ updateProjectV2Field(input:{fieldId:$f, singleSelectOptions:$o}){ projectV2Field{ ... on ProjectV2SingleSelectField{ options{ name } } } } }", variables: {f: $f, o: $o}}' \
  | gh api graphql --input - --jq '[.data.updateProjectV2Field.projectV2Field.options[].name] | join(", ")' \
  | sed 's/^/[provision] board columns: /'
jq -r --argjson want "$WANT" '.[] | select(.name as $n | $want | map(.name) | index($n) | not) | "[provision] warn: unmanaged column kept: \(.name)"' <<<"$NEXT"

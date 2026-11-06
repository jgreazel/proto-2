#!/usr/bin/env bash
# Factory dispatcher: moves board cards through Copilot.
#   Ready        -> assign Copilot, card -> In progress
#   Copilot done -> un-draft PR, enable auto-merge (squash), card -> In review
#   CI red / conflicts -> nudge @copilot (once per head SHA, max N), then -> Blocked
#   Issue closed -> Done
# Needs GH_TOKEN = user token (repo + project scopes). GITHUB_TOKEN can't assign Copilot.
set -euo pipefail

R="$GITHUB_REPOSITORY"
OWNER="${R%%/*}"
PN="${FACTORY_PROJECT:-2}"
MAX_NUDGES="${FACTORY_MAX_NUDGES:-3}"
BOT="copilot-swe-agent"

log() { echo "[factory] $*"; }

# --- project meta
META=$(gh api graphql -f query='
query($o:String!,$n:Int!){ user(login:$o){ projectV2(number:$n){ id
  field(name:"Status"){ ... on ProjectV2SingleSelectField{ id options{ id name } } } } } }' \
  -f o="$OWNER" -F n="$PN")
PID=$(jq -r '.data.user.projectV2.id' <<<"$META")
FID=$(jq -r '.data.user.projectV2.field.id' <<<"$META")
opt() { jq -r --arg n "$1" '.data.user.projectV2.field.options[] | select(.name==$n) | .id' <<<"$META"; }

set_status() { # item-id status-name
  gh project item-edit --id "$1" --project-id "$PID" --field-id "$FID" \
    --single-select-option-id "$(opt "$2")" >/dev/null
}

# --- auto-add: open issues authored by the owner that aren't on the board yet
ON_BOARD=$(gh project item-list "$PN" --owner "$OWNER" --limit 500 --format json \
  --jq "[.items[] | select(.content.repository==\"$R\") | .content.number]")
gh issue list -R "$R" --state open --author "$OWNER" --limit 200 --json number,url \
  --jq '.[] | "\(.number) \(.url)"' | while read -r num url; do
  if ! jq -e --argjson n "$num" 'index($n)' <<<"$ON_BOARD" >/dev/null; then
    id=$(gh project item-add "$PN" --owner "$OWNER" --url "$url" --format json --jq .id)
    set_status "$id" Todo
    log "#$num added to board (Todo)"
  fi
done

# --- walk board items
ITEMS=$(gh api graphql --paginate -f query='
query($o:String!,$n:Int!,$endCursor:String){ user(login:$o){ projectV2(number:$n){
  items(first:50, after:$endCursor){ pageInfo{ hasNextPage endCursor } nodes{ id
    fieldValueByName(name:"Status"){ ... on ProjectV2ItemFieldSingleSelectValue{ name } }
    content{ __typename ... on Issue{ number state repository{ nameWithOwner }
      closedByPullRequestsReferences(first:10, includeClosedPrs:false){ nodes{
        number isDraft headRefOid mergeable changedFiles author{ login } autoMergeRequest{ enabledAt }
        commits(last:1){ nodes{ commit{ statusCheckRollup{ state } } } } } } } } } } } } }' \
  -f o="$OWNER" -F n="$PN" --jq '.data.user.projectV2.items.nodes[]' | jq -s .)

# Copilot still working? true if last copilot_work_* event is "started"
copilot_working() {
  local last
  last=$(gh api --paginate "repos/$R/issues/$1/timeline?per_page=100" \
    --jq '.[] | select(.event=="copilot_work_started" or .event=="copilot_work_finished") | .event' | tail -1)
  [[ "$last" == "copilot_work_started" ]]
}

# Nudge @copilot once per head SHA; returns 1 when the nudge budget is spent.
nudge() { # pr sha message
  local pr=$1 sha=$2 msg=$3 marker="<!-- factory-nudge -->" count
  local body
  body=$(gh api --paginate "repos/$R/issues/$pr/comments?per_page=100" --jq '.[].body')
  grep -q "factory-nudge sha=$sha" <<<"$body" && return 0
  count=$(grep -c "$marker" <<<"$body" || true)
  ((count >= MAX_NUDGES)) && return 1
  gh pr comment "$pr" -R "$R" --body "@copilot $msg

$marker
<!-- factory-nudge sha=$sha -->" >/dev/null
  log "PR #$pr nudged ($((count + 1))/$MAX_NUDGES): $msg"
}

jq -c '.[] | select(.content.__typename=="Issue")' <<<"$ITEMS" | while read -r it; do
  repo=$(jq -r '.content.repository.nameWithOwner' <<<"$it")
  [[ "$repo" == "$R" ]] || continue
  item=$(jq -r '.id' <<<"$it")
  num=$(jq -r '.content.number' <<<"$it")
  state=$(jq -r '.content.state' <<<"$it")
  status=$(jq -r '.fieldValueByName.name // ""' <<<"$it")
  pr=$(jq -c --arg b "$BOT" '[.content.closedByPullRequestsReferences.nodes[] | select(.author.login==$b)] | last // empty' <<<"$it")

  if [[ "$state" == "CLOSED" ]]; then
    [[ "$status" == "Done" ]] || { set_status "$item" Done; log "#$num -> Done"; }
    continue
  fi
  [[ -z "$status" ]] && { set_status "$item" Todo; log "#$num -> Todo"; continue; }

  case "$status" in
    Ready)
      if [[ -n "$pr" ]]; then
        # re-queued card with an existing PR: tell Copilot to carry on
        gh pr comment "$(jq -r .number <<<"$pr")" -R "$R" \
          --body "@copilot Resume this work: finish the issue, then make CI pass (lint, tsc, build)." >/dev/null
      else
        gh issue edit "$num" -R "$R" --add-assignee "@copilot" >/dev/null
      fi
      set_status "$item" "In progress"
      log "#$num handed to Copilot -> In progress"
      ;;
    "In progress" | "In review")
      [[ -n "$pr" ]] || continue
      p=$(jq -r .number <<<"$pr")
      copilot_working "$p" && continue
      draft=$(jq -r .isDraft <<<"$pr")
      sha=$(jq -r .headRefOid <<<"$pr")
      files=$(jq -r .changedFiles <<<"$pr")
      ci=$(jq -r '.commits.nodes[0].commit.statusCheckRollup.state // "PENDING"' <<<"$pr")
      mergeable=$(jq -r .mergeable <<<"$pr")

      if [[ "$files" == "0" ]]; then
        set_status "$item" Blocked
        log "#$num Copilot finished with no changes (PR #$p) -> Blocked"
        continue
      fi
      if [[ "$draft" == "true" ]]; then
        gh pr ready "$p" -R "$R" >/dev/null
        log "PR #$p marked ready for review"
      fi
      if [[ "$mergeable" == "CONFLICTING" ]]; then
        nudge "$p" "$sha" "This PR has merge conflicts. Merge main into your branch, resolve them, and re-run lint, tsc, and build." \
          || { set_status "$item" Blocked; log "#$num out of nudges -> Blocked"; continue; }
      elif [[ "$ci" == "FAILURE" || "$ci" == "ERROR" ]]; then
        nudge "$p" "$sha" "CI failed on this PR. Read the failing CI run logs, fix the cause, and re-run lint, tsc, and build." \
          || { set_status "$item" Blocked; log "#$num out of nudges -> Blocked"; continue; }
      fi
      if [[ "$(jq -r '.autoMergeRequest // empty' <<<"$pr")" == "" ]]; then
        gh pr merge "$p" -R "$R" --auto --squash >/dev/null && log "PR #$p auto-merge (squash) enabled" \
          || log "PR #$p auto-merge not enabled yet"
      fi
      [[ "$status" == "In review" ]] || { set_status "$item" "In review"; log "#$num -> In review"; }
      ;;
  esac
done
log "sweep complete"

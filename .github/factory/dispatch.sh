#!/usr/bin/env bash
# Factory dispatcher: moves board cards through Copilot. Columns and limits come from factory.yml.
#   ready   -> assign Copilot (WIP-limited), card -> working
#   Copilot done -> un-draft PR, enable auto-merge (squash), card -> review
#   red checks / conflicts -> nudge @copilot (once per head SHA, max N), then -> blocked
#   Copilot review: request it, wait (max review_wait_min), one fix round on comments, then merge
#   human gate label -> no auto-merge; a person merges
#   issue closed -> done + end-of-run report
# Every transition lands in a per-card run log comment on the issue.
# Needs GH_TOKEN = user token (repo + project scopes). GITHUB_TOKEN can't assign Copilot.
set -euo pipefail

CFG="${FACTORY_CONFIG:-.github/factory/factory.yml}"
R="$GITHUB_REPOSITORY"
OWNER="${R%%/*}"
PN="${FACTORY_PROJECT:-$(yq '.project' "$CFG")}"
col() { yq ".board.columns[] | select(.role == \"$1\") | .name" "$CFG"; }
BACKLOG=$(col backlog) READY=$(col ready) WORKING=$(col working)
REVIEW=$(col review) BLOCKED=$(col blocked) DONE=$(col done)
WIP=$(yq '.limits.wip' "$CFG")
MAX_NUDGES=$(yq '.limits.max_nudges' "$CFG")
REVIEW_WAIT_MIN=$(yq '.limits.review_wait_min' "$CFG")
HUMAN_LABEL=$(yq '.gate.human_label' "$CFG")
# agent PRs: cloud agent may author as the requester; same-repo copilot/ branch is the marker (forks excluded)
AGENT_BRANCH="copilot/"
REVIEWER="copilot-pull-request-reviewer[bot]"
# trust state markers only from the factory account
ME=$(gh api user --jq .login)

log() { echo "[factory] $*"; }

FACTORY_PROJECT="$PN" bash "$(dirname "$0")/provision.sh"

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

# --- run log: one comment per card, a row per factory event
RUNLOG="<!-- factory-runlog -->"
runlog_comment() { # issue -> {id, body} of the run log comment, or empty
  gh api --paginate "repos/$R/issues/$1/comments?per_page=100" \
    --jq ".[] | select(.user.login==\"$ME\" and (.body | contains(\"$RUNLOG\"))) | {id, body}" | head -1
}
runlog() { # issue message
  local num=$1 msg=$2 c id body row last
  row="| $(date -u '+%Y-%m-%d %H:%M') | $msg |"
  c=$(runlog_comment "$num")
  if [[ -z "$c" ]]; then
    gh api "repos/$R/issues/$num/comments" -f body="### Factory run log
| When (UTC) | Event |
|---|---|
$row
$RUNLOG" >/dev/null
    return
  fi
  id=$(jq -r .id <<<"$c")
  body=$(jq -r .body <<<"$c" | grep -vF "$RUNLOG")
  # same event as last row: don't repeat it every sweep
  last=$(tail -1 <<<"$body" | cut -d'|' -f3 | xargs)
  [[ "$last" == "$(xargs <<<"$msg")" ]] && return
  gh api -X PATCH "repos/$R/issues/comments/$id" -f body="$body
$row
$RUNLOG" >/dev/null
}
card() { log "#$1 $2"; runlog "$1" "$2"; }

# --- end-of-run report, posted when a card reaches done
report() { # issue pr-json
  local num=$1 pr=$2 p d start merged mins nudges fixes
  p=$(jq -r .number <<<"$pr")
  d=$(gh pr view "$p" -R "$R" --json mergedAt,additions,deletions,changedFiles,comments)
  merged=$(jq -r '.mergedAt // empty' <<<"$d")
  start=$(runlog_comment "$num" | jq -r .body | grep -m1 'handed to Copilot' | cut -d'|' -f2 | xargs || true)
  mins="n/a"
  if [[ -n "$start" && -n "$merged" ]]; then
    mins=$(( ($(date -d "$merged" +%s) - $(date -d "$start UTC" +%s)) / 60 ))
  fi
  nudges=$(jq '[.comments[] | select(.body | contains("<!-- factory-nudge -->"))] | length' <<<"$d")
  fixes=$(jq '[.comments[] | select(.body | contains("<!-- factory-review-fix"))] | length' <<<"$d")
  gh api "repos/$R/issues/$num/comments" -f body="### Factory end-of-run report
| | |
|---|---|
| PR | #$p, merged ${merged:-n/a} |
| Change | $(jq -r '"\(.changedFiles) files, +\(.additions) / -\(.deletions)"' <<<"$d") |
| Cycle time (handed to Copilot -> merged) | $mins min |
| CI / conflict nudges | $nudges of $MAX_NUDGES |
| Code review fix rounds | $fixes |
| Expert verdicts | Expert review comment on #$p |
| Agent session log | #$p -> View session |
<!-- factory-report -->" >/dev/null
  log "#$num end-of-run report posted"
}

# --- auto-add: open issues authored by the owner that aren't on the board yet
ON_BOARD=$(gh project item-list "$PN" --owner "$OWNER" --limit 500 --format json \
  --jq "[.items[] | select(.content.repository==\"$R\") | .content.number]")
gh issue list -R "$R" --state open --author "$OWNER" --limit 200 --json number,url \
  --jq '.[] | "\(.number) \(.url)"' | while read -r num url; do
  if ! jq -e --argjson n "$num" 'index($n)' <<<"$ON_BOARD" >/dev/null; then
    id=$(gh project item-add "$PN" --owner "$OWNER" --url "$url" --format json --jq .id)
    set_status "$id" "$BACKLOG"
    card "$num" "added to board ($BACKLOG)"
  fi
done

# --- walk board items
ITEMS=$(gh api graphql --paginate -f query='
query($o:String!,$n:Int!,$endCursor:String){ user(login:$o){ projectV2(number:$n){
  items(first:50, after:$endCursor){ pageInfo{ hasNextPage endCursor } nodes{ id
    fieldValueByName(name:"Status"){ ... on ProjectV2ItemFieldSingleSelectValue{ name } }
    content{ __typename ... on Issue{ number state repository{ nameWithOwner } labels(first:20){ nodes{ name } }
      closedByPullRequestsReferences(first:10, includeClosedPrs:true){ nodes{
        number state isDraft headRefName isCrossRepository headRefOid mergeable changedFiles author{ login } autoMergeRequest{ enabledAt }
        } } } } } } } } }' \
  -f o="$OWNER" -F n="$PN" --jq '.data.user.projectV2.items.nodes[]' | jq -s .)

active=$(jq --arg w "$WORKING" '[.[] | select(.fieldValueByName.name == $w)] | length' <<<"$ITEMS")

# Coding agent still working? Reviewer app emits copilot_work_started with no finish, so scope to the SWE agent.
copilot_working() {
  local last
  last=$(gh api --paginate "repos/$R/issues/$1/timeline?per_page=100" \
    --jq '.[] | select((.event=="copilot_work_started" or .event=="copilot_work_finished")
      and .performed_via_github_app.slug=="copilot-swe-agent") | .event' | tail -1)
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

# GitHub's own isRequired() per context; base-branch rule contexts catch required checks not reported yet.
# Non-required checks (smoke on protected previews) must not trigger nudges.
required_ci() { # pr sha
  local s err req
  err=$(mktemp)
  s=$(gh api graphql -F o="${R%/*}" -F n="${R#*/}" -F pr="$1" -f query='
query($o:String!,$n:String!,$pr:Int!){ repository(owner:$o,name:$n){ pullRequest(number:$pr){
  headRefOid baseRefName
  commits(last:1){ nodes{ commit{ statusCheckRollup{ contexts(first:100){ nodes{ __typename
    ... on CheckRun{ name startedAt status conclusion isRequired(pullRequestNumber:$pr) }
    ... on StatusContext{ name: context startedAt: createdAt state isRequired(pullRequestNumber:$pr) } } } } } } } } } }' \
    --jq '.data.repository.pullRequest' 2>"$err") || s=""
  if [[ -z "$s" ]]; then
    log "PR #$1 check lookup failed: $(head -c 300 "$err")" >&2; rm -f "$err"; echo PENDING; return
  fi
  # head moved since the board read -> decide next sweep, never against a stale SHA
  [[ "$(jq -r .headRefOid <<<"$s")" == "$2" ]] || { echo PENDING; return; }
  req=$(gh api "repos/$R/rules/branches/$(jq -r .baseRefName <<<"$s")" \
    --jq '[.[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context]' 2>"$err") \
    || { log "PR #$1 rules lookup failed: $(head -c 300 "$err")" >&2; rm -f "$err"; echo PENDING; return; }
  rm -f "$err"
  # classic branch protection too (404 = none; gh prints the error body to stdout)
  local classic
  classic=$(gh api "repos/$R/branches/$(jq -r .baseRefName <<<"$s")/protection/required_status_checks" 2>/dev/null) || classic='{}'
  req=$(jq -c --argjson c "$(jq -c '.contexts // []' <<<"$classic")" '. + $c | unique' <<<"$req")
  jq -r --argjson req "$req" '
    # latest run per check (queued = no startedAt = newest); superseded runs do not count
    ([.commits.nodes[0].commit.statusCheckRollup.contexts.nodes[]? | select(.isRequired)]
      | group_by(.name) | map(max_by(.startedAt // "9999"))) as $c
    | if any($c[]; (.conclusion // .state) | IN("FAILURE","ERROR","CANCELLED","TIMED_OUT","ACTION_REQUIRED","STARTUP_FAILURE")) then "FAILURE"
      elif ($c | length) == 0 then "PENDING"
      elif all($c[]; (.conclusion // .state) | IN("SUCCESS","NEUTRAL","SKIPPED"))
        and all($req[]; . as $r | any($c[]; .name == $r)) then "SUCCESS"
      else "PENDING" end' <<<"$s"
}

# Copilot code review gate. 0 = ok to merge, 1 = wait.
# One fix round: comments -> nudge Copilot once -> merge after it pushes.
review_gate() { # pr sha
  local pr=$1 sha=$2 reviews comments mine fix at last rid rsha n req age
  reviews=$(gh api --paginate "repos/$R/pulls/$pr/reviews?per_page=100" --jq "[.[] | select(.user.login==\"$REVIEWER\")]" | jq -s 'add // []') || return 1
  comments=$(gh api --paginate "repos/$R/issues/$pr/comments?per_page=100" | jq -s 'add // []') || return 1
  mine=$(jq --arg me "$ME" '[.[] | select(.user.login==$me)]' <<<"$comments")
  if [[ "$(jq length <<<"$reviews")" == "0" ]]; then
    req=$(jq -r '[.[] | select(.body | contains("<!-- factory-review-requested -->"))][0].created_at // empty' <<<"$mine")
    if [[ -z "$req" ]]; then
      gh api -X POST "repos/$R/pulls/$pr/requested_reviewers" -f "reviewers[]=$REVIEWER" >/dev/null || log "PR #$pr Copilot review request failed"
      gh pr comment "$pr" -R "$R" --body "Factory: waiting up to ${REVIEW_WAIT_MIN}m for Copilot code review before merge.
<!-- factory-review-requested -->" >/dev/null
      log "PR #$pr Copilot review requested"
      return 1
    fi
    age=$(( ($(date +%s) - $(date -d "$req" +%s)) / 60 ))
    if ((age < REVIEW_WAIT_MIN)); then log "PR #$pr waiting on Copilot review (${age}m)"; return 1; fi
    log "PR #$pr no Copilot review after ${age}m, merging on CI"
    return 0
  fi
  # already did the fix round: merge once Copilot pushed past the reviewed commit
  fix=$(jq -c '[.[] | select(.body | contains("<!-- factory-review-fix"))][0] // empty' <<<"$mine")
  if [[ -n "$fix" ]]; then
    rsha=$(jq -r .body <<<"$fix" | grep -o 'sha=[0-9a-f]*' | cut -d= -f2 || true)
    [[ "$sha" != "$rsha" ]] && return 0
    # no new commit: Copilot replied instead, or the round timed out
    at=$(jq -r .created_at <<<"$fix")
    jq -e --arg at "$at" 'any(.[]; .created_at > $at and (.user.login | IN("Copilot", "copilot-swe-agent", "copilot-swe-agent[bot]")))' <<<"$comments" >/dev/null && { log "PR #$pr Copilot replied to review without changes"; return 0; }
    age=$(( ($(date +%s) - $(date -d "$at" +%s)) / 60 ))
    ((age >= REVIEW_WAIT_MIN * 3)) && { log "PR #$pr review fix round timed out (${age}m), merging on CI"; return 0; }
    log "PR #$pr waiting on Copilot to address review (${age}m)"; return 1
  fi
  last=$(jq -c 'last' <<<"$reviews")
  rid=$(jq -r .id <<<"$last")
  n=$(gh api "repos/$R/pulls/$pr/reviews/$rid/comments" --jq length) || return 1
  [[ "$n" =~ ^[0-9]+$ ]] || return 1
  ((n == 0)) && { log "PR #$pr Copilot review clean"; return 0; }
  gh pr comment "$pr" -R "$R" --body "@copilot Address the $n Copilot code review comment(s) on this PR: fix each one, or reply explaining why not. Then re-run lint, tsc, and build.

<!-- factory-review-fix sha=$sha -->" >/dev/null
  log "PR #$pr asked Copilot to address $n review comment(s)"
  return 1
}

to_review() { # item num status
  [[ "$3" == "$REVIEW" ]] || { set_status "$1" "$REVIEW"; card "$2" "-> $REVIEW"; }
}

jq -c '.[] | select(.content.__typename=="Issue")' <<<"$ITEMS" | while read -r it; do
  repo=$(jq -r '.content.repository.nameWithOwner' <<<"$it")
  [[ "$repo" == "$R" ]] || continue
  item=$(jq -r '.id' <<<"$it")
  num=$(jq -r '.content.number' <<<"$it")
  state=$(jq -r '.content.state' <<<"$it")
  status=$(jq -r '.fieldValueByName.name // ""' <<<"$it")
  prs=$(jq -c --arg b "$AGENT_BRANCH" '[.content.closedByPullRequestsReferences.nodes[] | select((.headRefName | startswith($b)) and (.isCrossRepository | not))]' <<<"$it")
  pr=$(jq -c '[.[] | select(.state=="OPEN")] | last // empty' <<<"$prs")
  human=$(jq -r --arg l "$HUMAN_LABEL" '[.content.labels.nodes[].name] | index($l) != null' <<<"$it")

  if [[ "$state" == "CLOSED" ]]; then
    if [[ "$status" != "$DONE" ]]; then
      set_status "$item" "$DONE"; card "$num" "-> $DONE"
      merged=$(jq -c '[.[] | select(.state=="MERGED")] | last // empty' <<<"$prs")
      [[ -n "$merged" ]] && report "$num" "$merged"
    fi
    continue
  fi
  [[ -z "$status" ]] && { set_status "$item" "$BACKLOG"; card "$num" "-> $BACKLOG"; continue; }

  case "$status" in
    "$READY")
      if ((active >= WIP)); then log "#$num waiting: WIP limit $WIP reached"; continue; fi
      if [[ -n "$pr" ]]; then
        # re-queued card with an existing PR: tell Copilot to carry on
        gh pr comment "$(jq -r .number <<<"$pr")" -R "$R" \
          --body "@copilot Resume this work: finish the issue, then make CI pass (lint, tsc, build)." >/dev/null
      else
        gh issue edit "$num" -R "$R" --add-assignee "@copilot" >/dev/null
      fi
      set_status "$item" "$WORKING"
      active=$((active + 1))
      card "$num" "handed to Copilot -> $WORKING"
      ;;
    "$WORKING" | "$REVIEW")
      [[ -n "$pr" ]] || continue
      p=$(jq -r .number <<<"$pr")
      copilot_working "$p" && continue
      draft=$(jq -r .isDraft <<<"$pr")
      sha=$(jq -r .headRefOid <<<"$pr")
      files=$(jq -r .changedFiles <<<"$pr")
      ci=$(required_ci "$p" "$sha")
      mergeable=$(jq -r .mergeable <<<"$pr")

      if [[ "$files" == "0" ]]; then
        set_status "$item" "$BLOCKED"
        card "$num" "Copilot finished with no changes (PR #$p) -> $BLOCKED"
        continue
      fi
      if [[ "$draft" == "true" ]]; then
        gh pr ready "$p" -R "$R" >/dev/null
        card "$num" "Copilot finished; PR #$p marked ready for review"
      fi
      if [[ "$mergeable" == "CONFLICTING" ]]; then
        nudge "$p" "$sha" "This PR has merge conflicts. Merge main into your branch, resolve them, and re-run lint, tsc, and build." \
          || { set_status "$item" "$BLOCKED"; card "$num" "out of nudges (conflicts) -> $BLOCKED"; continue; }
      elif [[ "$ci" == "FAILURE" || "$ci" == "ERROR" ]]; then
        nudge "$p" "$sha" "A required check failed on this PR (CI, factory checks, or an expert review). Read the failing check output and the Expert review comment, fix the cause, and re-run lint, tsc, and build." \
          || { set_status "$item" "$BLOCKED"; card "$num" "out of nudges (checks red) -> $BLOCKED"; continue; }
      fi
      [[ "$ci" == "SUCCESS" ]] || { to_review "$item" "$num" "$status"; continue; }
      if [[ "$human" == "true" ]]; then
        to_review "$item" "$num" "$status"
        card "$num" "checks green; waiting for a human to review and merge PR #$p ($HUMAN_LABEL)"
        continue
      fi
      if [[ "$(jq -r '.autoMergeRequest // empty' <<<"$pr")" == "" ]]; then
        review_gate "$p" "$sha" || { to_review "$item" "$num" "$status"; continue; }
        gh pr merge "$p" -R "$R" --auto --squash >/dev/null && card "$num" "PR #$p auto-merge (squash) armed" \
          || log "PR #$p auto-merge not enabled yet"
      fi
      to_review "$item" "$num" "$status"
      ;;
  esac
done
log "sweep complete"

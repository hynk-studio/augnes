import type { VNextOperatorStrategicAdvantageTransferReadbackV01 } from "@/lib/vnext/runtime/operator-pilot-strategic-advantage-transfer";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { StrategicAdvantageTransferProfileV01 } from "@/types/vnext/strategic-advantage-transfer";

import type { SemanticReviewStrategicAnalysisRequestV01 } from "./semantic-review-types";
import styles from "./semantic-review.module.css";

export function StrategicAdvantageTransferPanel({
  proposal,
  readback,
  busy,
  onRequest,
}: {
  proposal: EpisodeDeltaProposalV01;
  readback: VNextOperatorStrategicAdvantageTransferReadbackV01;
  busy: boolean;
  onRequest: (
    request: SemanticReviewStrategicAnalysisRequestV01,
  ) => Promise<void>;
}) {
  const profile = proposal.strategic_advantage_transfer;
  const displayStatus = profile
    ? readback.status === "available"
      ? "pending review"
      : readback.status
    : readback.status;

  return (
    <section
      className={styles.panel}
      data-vnext-strategic-advantage-transfer={
        profile ? "proposal" : readback.status
      }
      data-vnext-strategic-readback-status={readback.status}
      data-vnext-strategic-optional="true"
      data-vnext-strategic-authoritative="false"
      aria-labelledby="strategic-advantage-transfer-title"
    >
      <div className={styles.panelHeader}>
        <div className={styles.rowBetween}>
          <p className={styles.kicker}>Optional R6 strategic profile</p>
          <span className={styles.badge}>{displayStatus}</span>
        </div>
        <h2 id="strategic-advantage-transfer-title">
          Bounded strategic local transfer
        </h2>
        <p className={styles.copy}>
          This optional server-owned profile considers local, source-linked
          improvements to one exact accepted plan. It never blocks the
          zero-model review path and grants no decision, Transition,
          semantic-state, later-context, execution, or external-action
          authority.
        </p>
      </div>

      {profile ? (
        <StrategicProposalMaterial profile={profile} readback={readback} />
      ) : (
        <StrategicSourceAvailability
          proposal={proposal}
          readback={readback}
          busy={busy}
          onRequest={onRequest}
        />
      )}
    </section>
  );
}

function StrategicSourceAvailability({
  proposal,
  readback,
  busy,
  onRequest,
}: {
  proposal: EpisodeDeltaProposalV01;
  readback: VNextOperatorStrategicAdvantageTransferReadbackV01;
  busy: boolean;
  onRequest: (
    request: SemanticReviewStrategicAnalysisRequestV01,
  ) => Promise<void>;
}) {
  return (
    <>
      <dl className={styles.statusGrid}>
        <div>
          <dt>Eligibility</dt>
          <dd>{readback.status}</dd>
        </div>
        <div>
          <dt>Exact base</dt>
          <dd>{readback.base_label ?? "No eligible accepted plan"}</dd>
        </div>
        <div>
          <dt>Local model capability</dt>
          <dd>{readback.model_capability.status}</dd>
        </div>
        <div>
          <dt>Fixed ephemeral lenses</dt>
          <dd>{readback.lenses.length}</dd>
        </div>
        <div>
          <dt>Preserved model attempts</dt>
          <dd>{readback.model_attempt_count}</dd>
        </div>
        <div>
          <dt>Current new-invocation pricing</dt>
          <dd>
            {readback.current_cost_availability.status === "available"
              ? "available"
              : humanizeCode(readback.current_cost_availability.reason)}
          </dd>
        </div>
      </dl>
      {readback.last_model_attempt ? (
        <section
          className={styles.materialCard}
          data-vnext-strategic-model-attempt="true"
        >
          <h3>Last bounded Gateway attempt</h3>
          <span>Status: {readback.last_model_attempt.status}</span>
          <span>
            Failure:{" "}
            {readback.last_model_attempt.failure_code
              ? humanizeCode(readback.last_model_attempt.failure_code)
              : "none at Gateway boundary; later local settlement failed"}
          </span>
          <span>
            Provider egress attempted:{" "}
            {readback.last_model_attempt.egress_attempted ? "yes" : "no"}
          </span>
          <StrategicRefs
            title="Exact ModelInvocationReceipt lineage"
            refs={[readback.last_model_attempt.receipt_ref]}
          />
          <p className={styles.muted}>
            This attempt is audit provenance only. A locally rejected result
            grants no authority, and v0.1 does not invoke a provider again for
            the same exact analysis identity.
          </p>
        </section>
      ) : null}
      <p className={styles.muted}>
        {readback.model_capability.summary} Project scope, active selection,
        classification, and egress policy are rechecked by the server only when
        the operator explicitly requests analysis.
      </p>
      <div className={styles.twoColumnGrid}>
        <section className={styles.materialCard}>
          <h3>Server-owned lens profile</h3>
          <ul className={styles.plainList} data-vnext-strategic-lenses="fixed">
            {readback.lenses.map((lens) => (
              <li key={lens}>{lensLabel(lens)}</li>
            ))}
          </ul>
          <p className={styles.muted}>
            These lenses are ephemeral labels used together in one invocation.
            They are not actors, agents, voters, judges, sessions, or durable
            memory.
          </p>
        </section>
        <section className={styles.materialCard}>
          <h3>Bounded server policy</h3>
          <span>One logical Model Gateway invocation</span>
          <span>
            At most {readback.budget.max_transfer_items} transfer items
          </span>
          <span>
            At most {readback.budget.model.max_output_tokens} output tokens
          </span>
          <span>Timeout {readback.budget.model.timeout_ms} ms</span>
          <span>Automatic retry: no · provider failover: no</span>
          {readback.budget.model.cost.status === "available" ? (
            <>
              <span>
                Maximum cost: {readback.budget.model.cost.budget.maximum_permitted_cost}{" "}
                {readback.budget.model.cost.budget.authority.cost_unit}
              </span>
              <span>
                Worst-case bounded cost: {readback.budget.model.cost.budget.calculated_worst_case_cost}{" "}
                {readback.budget.model.cost.budget.authority.cost_unit}
              </span>
              <span>
                Pricing and project policy are exact-bound before provider
                egress.
              </span>
            </>
          ) : (
            <span>
              Strategic analysis is unavailable for a new invocation: {" "}
              {readback.current_cost_availability.status === "unavailable"
                ? humanizeCode(readback.current_cost_availability.reason)
                : "cost authority unavailable"}
              .
            </span>
          )}
          <p className={styles.muted}>
            Model, provider, source catalog, profile, lenses, and budget are
            derived by the server; this surface accepts no overrides.
          </p>
        </section>
      </div>

      {readback.status === "available" && readback.existing_proposal ? (
        <div className={styles.buttonRow}>
          <a
            className={styles.linkButton}
            href={readback.existing_proposal.review_href}
            data-vnext-strategic-review-link="true"
          >
            Open exact strategic proposal
          </a>
        </div>
      ) : null}

      {readback.status === "eligible" ? (
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.button}
            disabled={busy}
            data-vnext-strategic-request={
              readback.model_invocation_required ? "true" : "reconcile"
            }
            onClick={() => {
              void onRequest({
                action: "request_strategic_advantage_transfer",
                proposal_id: proposal.proposal_id,
                proposal_fingerprint: proposal.integrity.fingerprint,
              });
            }}
          >
            {busy
              ? readback.model_invocation_required
                ? "Requesting bounded analysis…"
                : "Completing settled proposal admission…"
              : readback.model_invocation_required
                ? "Request bounded strategic analysis"
                : "Complete settled proposal admission"}
          </button>
        </div>
      ) : null}

      {readback.reason ? (
        <p
          className={readback.status === "stale" ? styles.notice : styles.empty}
        >
          {readback.status === "eligible"
            ? `A prior bounded attempt needs explicit reconciliation: ${humanizeCode(readback.reason)}. ${readback.model_invocation_required ? "This explicit retry may invoke the bounded Model Gateway once." : "The exact settled model result will be reused without another model invocation."}`
            : `Strategic analysis is ${readback.status}: ${humanizeCode(readback.reason)}. The source proposal remains available for normal zero-model review.`}
        </p>
      ) : null}

      <p className={styles.notice}>
        Nothing runs on page load. The authenticated operator must explicitly
        request this optional analysis. Model unavailability leaves proposal
        review, decisions, eligible Transitions, and later-context compilation
        unchanged.
      </p>
    </>
  );
}

function StrategicProposalMaterial({
  profile,
  readback,
}: {
  profile: StrategicAdvantageTransferProfileV01;
  readback: VNextOperatorStrategicAdvantageTransferReadbackV01;
}) {
  return (
    <>
      <dl className={styles.statusGrid}>
        <div>
          <dt>Base strategy</dt>
          <dd>{profile.base_strategy.bounded_summary}</dd>
        </div>
        <div>
          <dt>Transfer items</dt>
          <dd>{profile.transfer_items.length}</dd>
        </div>
        <div>
          <dt>Stop reason</dt>
          <dd>{profile.stop_reason}</dd>
        </div>
        <div>
          <dt>Candidate operation</dt>
          <dd>unknown · human revision required</dd>
        </div>
      </dl>

      <section
        className={styles.materialCard}
        data-vnext-strategic-historical-cost="true"
      >
        <h3>Historical invocation budget</h3>
        {profile.budget.model.cost.status === "available" ? (
          <>
            <span>
              Authorized maximum:{" "}
              {profile.budget.model.cost.budget.maximum_permitted_cost}{" "}
              {profile.budget.model.cost.budget.authority.cost_unit}
            </span>
            <span>
              Calculated worst case:{" "}
              {profile.budget.model.cost.budget.calculated_worst_case_cost}{" "}
              {profile.budget.model.cost.budget.authority.cost_unit}
            </span>
            <span>
              Pricing snapshot:{" "}
              {
                profile.budget.model.cost.budget.authority
                  .pricing_source_version
              }
            </span>
          </>
        ) : (
          <span>Historical cost authority is unavailable.</span>
        )}
        <span data-vnext-strategic-current-cost-availability="true">
          Current new-invocation pricing:{" "}
          {readback.current_cost_availability.status === "available"
            ? "available"
            : humanizeCode(readback.current_cost_availability.reason)}
        </span>
        <p className={styles.muted}>
          The embedded budget is immutable authorization lineage for the
          completed invocation. Current pricing availability does not rewrite
          this proposal or determine whether its semantic sources are stale.
        </p>
      </section>

      {readback.status !== "available" ? (
        <p className={styles.notice} data-vnext-strategic-actionable="false">
          This historical strategic proposal remains readable but is not
          currently actionable:{" "}
          {humanizeCode(readback.reason ?? "source binding unavailable")}. No
          read or reload repairs the source or invokes a model.
        </p>
      ) : null}

      <section
        className={styles.materialCard}
        data-vnext-strategic-frame="v0.1"
      >
        <h3>Exact working frame</h3>
        <strong>{profile.working_frame.task_goal}</strong>
        <span>
          {profile.working_frame.success_criteria.length} success criterion
          item(s)
        </span>
        <span>
          {profile.working_frame.required_checks.length} required check(s)
        </span>
        <span>
          {profile.working_frame.gap_summaries.length} bounded gap summary
          item(s)
        </span>
        <p className={styles.muted}>
          Built server-side from the exact packet, receipt, assessment, source
          proposal, selected accepted state, constraints, exclusions, trust, and
          coverage.
        </p>
      </section>

      <section
        className={styles.materialCard}
        data-vnext-strategic-server-adverse-context="true"
      >
        <h3>Server-owned adverse context</h3>
        <p className={styles.copy}>
          Model-selected sources preserve a proposed relation only. Receipt-wide
          conflicts, skipped or failed checks, unavailable coverage, missing or
          unknown material, and source-less blockers remain in the server
          classification even when the model omits them.
        </p>
        <span>
          {profile.server_adverse_context.items.length} bounded adverse context
          item(s)
        </span>
        <ul className={styles.plainList}>
          {profile.server_adverse_context.items.map((item) => (
            <li key={item.code}>
              <strong>{humanizeCode(item.category)}</strong>
              <span>{item.bounded_summary}</span>
              <span>
                {item.scope === "source_linked"
                  ? `${item.source_refs.length} exact source ref(s)`
                  : "task-wide contextual residue; no source ref was fabricated"}
                {` · ${humanizeCode(item.epistemic_class)}`}
              </span>
            </li>
          ))}
        </ul>
        {profile.server_adverse_context.items.length === 0 ? (
          <p className={styles.muted}>
            No unresolved adverse context is present.
          </p>
        ) : null}
      </section>

      <ol
        className={styles.candidateList}
        data-vnext-strategic-transfer-items="true"
      >
        {profile.transfer_items.map((item) => (
          <li className={styles.candidate} key={item.transfer_id}>
            <div className={styles.candidateHeader}>
              <div>
                <p className={styles.kicker}>{lensLabel(item.lens_id)}</p>
                <h3>{item.title}</h3>
              </div>
              <span className={styles.badge}>
                {item.support.status} · {item.support.basis}
              </span>
            </div>
            <dl className={styles.statusGrid}>
              <div>
                <dt>Applicability</dt>
                <dd>{item.applicability_condition}</dd>
              </div>
              <div>
                <dt>Expected effect</dt>
                <dd>{item.expected_effect}</dd>
              </div>
              <div>
                <dt>Transfer cost</dt>
                <dd>{item.transfer_cost}</dd>
              </div>
              <div>
                <dt>Falsifier</dt>
                <dd>{item.falsifier}</dd>
              </div>
            </dl>
            <section className={styles.materialCard}>
              <h3>Source-linked patch</h3>
              <p className={styles.copy}>{item.patch_summary}</p>
              <p className={styles.muted}>
                Final server support: {item.support.status} ·{" "}
                {item.support.basis}
                {" · "}
                {item.support.conflicted_material}
                {" conflict · "}{item.support.skipped_material}
                {" skipped · "}{item.support.unavailable_material}
                {" unavailable · "}{item.support.missing_material}
                {" missing · "}{item.support.uncertain_material}
                {" uncertain item(s)"}
              </p>
              <p className={styles.muted}>
                Positive support policy: explicit strategic-transfer
                observations only. Source trust, passed transport checks,
                execution completion, source count, wording, and lens agreement
                do not establish transfer relevance.
              </p>
            </section>
            <StrategicTextList title="Uncertainty" items={item.uncertainty} />
            <StrategicTextList
              title="Introduced or transferred risks"
              items={item.introduced_risks}
            />
            <StrategicTextList
              title="Known limitations"
              items={item.known_limitations}
            />
            <div className={styles.twoColumnGrid}>
              <StrategicTextList
                title="Regression risks"
                items={item.regression_review.regression_risks}
              />
              <StrategicTextList
                title="Checks or observations needed"
                items={item.regression_review.checks_or_observations_needed}
              />
              <StrategicTextList
                title="Stop conditions"
                items={item.regression_review.stop_conditions}
              />
              <StrategicTextList
                title="Invalidation conditions"
                items={item.regression_review.invalidation_conditions}
              />
            </div>
            <StrategicRefs
              title="Model-selected candidate source relation"
              refs={item.source_refs}
            />
            <p className={styles.notice}>
              Omitted adverse material remains visible and cannot be selected
              away. This transfer is mapped to an existing research or
              validation lane with operation unknown. It remains
              review-required, non-authoritative, and is not Transition-ready.
            </p>
          </li>
        ))}
      </ol>
      {profile.transfer_items.length === 0 ? (
        <section
          className={styles.materialCard}
          data-vnext-strategic-no-transfer="true"
        >
          <h3>Bounded no-transfer result</h3>
          <p className={styles.copy}>
            No fixed lens returned a source-supported local transfer. One
            operation-unknown research candidate preserves this exact result for
            defer or reject review and deterministic replay.
          </p>
          <ul className={styles.plainList}>
            {profile.normalized_model_output.lens_results
              .filter((result) => result.result === "no_transfer")
              .map((result) => (
                <li key={result.lens_id}>
                  <strong>{lensLabel(result.lens_id)}</strong>
                  <span>{result.non_transfer_reason}</span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <div className={styles.twoColumnGrid}>
        <StrategicRefs
          title="Base and source lineage"
          refs={[
            profile.base_strategy.state_ref,
            profile.base_strategy.target_ref,
            ...profile.base_strategy.source_refs,
          ]}
        />
        <StrategicRefs
          title="Packet, receipt, and model-receipt lineage"
          refs={[
            profile.packet_ref,
            profile.receipt_ref,
            profile.model_invocation.receipt_ref,
          ]}
        />
      </div>
      <p className={styles.muted}>
        Working frame {profile.working_frame.working_frame_fingerprint}; source
        catalog {profile.source_catalog.source_catalog_fingerprint}; model
        invocation receipt {profile.model_invocation.receipt_fingerprint}.
      </p>
      <p
        className={styles.notice}
        data-vnext-strategic-authority-boundary="true"
      >
        Normalized bounded material is stored; raw prompts, raw provider output,
        transcripts, hidden reasoning, confidence scores, rankings, winners,
        consensus, and votes are not proposal material. Agreement and model
        provenance grant no authority.
      </p>
    </>
  );
}

function StrategicTextList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className={styles.materialCard} aria-label={title}>
      <h3>{title}</h3>
      <ul className={styles.plainList}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function StrategicRefs({
  title,
  refs,
}: {
  title: string;
  refs: ExternalRefV01[];
}) {
  const uniqueRefs = [
    ...new Map(refs.map((ref) => [externalRefKey(ref), ref])).values(),
  ];
  return (
    <section className={styles.materialCard} aria-label={title}>
      <h3>{title}</h3>
      <ul className={styles.plainList}>
        {uniqueRefs.map((ref) => (
          <li key={externalRefKey(ref)}>
            <strong>{ref.ref_type}</strong>
            <span className={styles.identifier}>{ref.external_id}</span>
            <span>
              {ref.trust_class} · {ref.source_ref ?? "no source fingerprint"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function lensLabel(value: string): string {
  switch (value) {
    case "constraint_fit":
      return "Constraint fit";
    case "verification_leverage":
      return "Verification leverage";
    case "regression_safety":
      return "Regression safety";
    default:
      return value;
  }
}

function humanizeCode(value: string): string {
  return value.replaceAll("_", " ");
}

function externalRefKey(ref: ExternalRefV01): string {
  return [
    ref.compatibility_namespace ?? "",
    ref.ref_type,
    ref.external_id,
    ref.trust_class,
    ref.source_ref ?? "",
  ].join("|");
}

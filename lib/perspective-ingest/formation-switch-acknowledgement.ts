export type FormationSwitchAcknowledgedBasis = "current" | "manual_selection";
export type FormationSwitchCostTier = "free_local";

export type FormationSwitchAcknowledgementContext = {
  basis: FormationSwitchAcknowledgedBasis;
  basisVersion: string;
  sourceQuery: string;
  constellationId: string;
  formationId: string;
  contextFingerprint: string;
};

export type FormationSwitchAcknowledgementMetadata =
  FormationSwitchAcknowledgementContext & {
    costTier: FormationSwitchCostTier;
    externalCalls: false;
    apiBillable: false;
    persistence: false;
    acknowledgedAt: string;
    expiresAt: string;
  };

export type FormationSwitchAcknowledgementStorageSnapshot = {
  available: boolean;
  rawAcknowledgementPresent: boolean;
  acknowledgement: FormationSwitchAcknowledgementMetadata | null;
  malformed: boolean;
};

export const FORMATION_SWITCH_ACKNOWLEDGEMENT_STORAGE_KEY =
  "augnes.perspective.formationSwitchAcknowledgement.v0_1";
export const FORMATION_SWITCH_BASIS_VERSION = "formation_basis_switch.v0.1";
export const FORMATION_SWITCH_ACKNOWLEDGEMENT_TTL_MS = 24 * 60 * 60 * 1000;

export const FORMATION_SWITCH_ACKNOWLEDGEMENT_FORBIDDEN_STORAGE_FIELDS = [
  "raw graph",
  "pasted text",
  "source text",
  "packet text",
  "prompt text",
  "model output",
  "private history",
] as const;

export function buildFormationSwitchContextFingerprint(
  safeMetadataParts: readonly (string | number | boolean | null | undefined)[],
) {
  return safeMetadataParts
    .map((part) => String(part ?? "none").replace(/\s+/g, "_"))
    .join("|");
}

export function buildFormationSwitchAcknowledgement({
  context,
  now = new Date(),
}: {
  context: FormationSwitchAcknowledgementContext;
  now?: Date;
}): FormationSwitchAcknowledgementMetadata {
  const acknowledgedAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + FORMATION_SWITCH_ACKNOWLEDGEMENT_TTL_MS,
  ).toISOString();

  return {
    ...context,
    costTier: "free_local",
    externalCalls: false,
    apiBillable: false,
    persistence: false,
    acknowledgedAt,
    expiresAt,
  };
}

export function parseFormationSwitchAcknowledgement(rawAcknowledgement: string | null) {
  if (!rawAcknowledgement) {
    return {
      acknowledgement: null,
      malformed: false,
    };
  }

  try {
    const parsedAcknowledgement = JSON.parse(rawAcknowledgement) as Partial<
      FormationSwitchAcknowledgementMetadata
    >;

    if (
      !isFormationSwitchAcknowledgedBasis(parsedAcknowledgement.basis) ||
      parsedAcknowledgement.basisVersion !== FORMATION_SWITCH_BASIS_VERSION ||
      typeof parsedAcknowledgement.sourceQuery !== "string" ||
      typeof parsedAcknowledgement.constellationId !== "string" ||
      typeof parsedAcknowledgement.formationId !== "string" ||
      typeof parsedAcknowledgement.contextFingerprint !== "string" ||
      parsedAcknowledgement.costTier !== "free_local" ||
      parsedAcknowledgement.externalCalls !== false ||
      parsedAcknowledgement.apiBillable !== false ||
      parsedAcknowledgement.persistence !== false ||
      typeof parsedAcknowledgement.acknowledgedAt !== "string" ||
      typeof parsedAcknowledgement.expiresAt !== "string"
    ) {
      return {
        acknowledgement: null,
        malformed: true,
      };
    }

    return {
      acknowledgement: {
        basis: parsedAcknowledgement.basis,
        basisVersion: FORMATION_SWITCH_BASIS_VERSION,
        sourceQuery: parsedAcknowledgement.sourceQuery,
        constellationId: parsedAcknowledgement.constellationId,
        formationId: parsedAcknowledgement.formationId,
        contextFingerprint: parsedAcknowledgement.contextFingerprint,
        costTier: "free_local",
        externalCalls: false,
        apiBillable: false,
        persistence: false,
        acknowledgedAt: parsedAcknowledgement.acknowledgedAt,
        expiresAt: parsedAcknowledgement.expiresAt,
      } satisfies FormationSwitchAcknowledgementMetadata,
      malformed: false,
    };
  } catch {
    return {
      acknowledgement: null,
      malformed: true,
    };
  }
}

export function readFormationSwitchAcknowledgementFromStorage() {
  if (typeof window === "undefined") {
    return {
      available: false,
      rawAcknowledgementPresent: false,
      acknowledgement: null,
      malformed: false,
    } satisfies FormationSwitchAcknowledgementStorageSnapshot;
  }

  try {
    const rawAcknowledgement = window.localStorage.getItem(
      FORMATION_SWITCH_ACKNOWLEDGEMENT_STORAGE_KEY,
    );
    const parsedAcknowledgement = parseFormationSwitchAcknowledgement(
      rawAcknowledgement,
    );

    return {
      available: true,
      rawAcknowledgementPresent: Boolean(rawAcknowledgement),
      acknowledgement: parsedAcknowledgement.acknowledgement,
      malformed: parsedAcknowledgement.malformed,
    } satisfies FormationSwitchAcknowledgementStorageSnapshot;
  } catch {
    return {
      available: false,
      rawAcknowledgementPresent: false,
      acknowledgement: null,
      malformed: false,
    } satisfies FormationSwitchAcknowledgementStorageSnapshot;
  }
}

export function writeFormationSwitchAcknowledgementToStorage(
  acknowledgement: FormationSwitchAcknowledgementMetadata,
) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(
      FORMATION_SWITCH_ACKNOWLEDGEMENT_STORAGE_KEY,
      JSON.stringify(acknowledgement),
    );
    return true;
  } catch {
    return false;
  }
}

export function formationSwitchAcknowledgementIsValid({
  acknowledgement,
  context,
  now = new Date(),
}: {
  acknowledgement: FormationSwitchAcknowledgementMetadata | null;
  context: FormationSwitchAcknowledgementContext;
  now?: Date;
}) {
  if (!acknowledgement) return false;

  return (
    acknowledgement.basis === context.basis &&
    acknowledgement.basisVersion === context.basisVersion &&
    acknowledgement.sourceQuery === context.sourceQuery &&
    acknowledgement.constellationId === context.constellationId &&
    acknowledgement.formationId === context.formationId &&
    acknowledgement.contextFingerprint === context.contextFingerprint &&
    acknowledgement.costTier === "free_local" &&
    acknowledgement.externalCalls === false &&
    acknowledgement.apiBillable === false &&
    acknowledgement.persistence === false &&
    Date.parse(acknowledgement.expiresAt) > now.getTime()
  );
}

function isFormationSwitchAcknowledgedBasis(
  value: unknown,
): value is FormationSwitchAcknowledgedBasis {
  return value === "current" || value === "manual_selection";
}

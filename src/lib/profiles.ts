import { Profile } from "@stackforge-eu/factur-x";

export const PROFILE_LABELS: Record<Profile, string> = {
  [Profile.MINIMUM]: "MINIMUM",
  [Profile.BASIC_WL]: "BASIC WL",
  [Profile.BASIC]: "BASIC",
  [Profile.EN16931]: "EN 16931",
  [Profile.EXTENDED]: "EXTENDED",
};

const PROFILE_BY_SUFFIX: Record<string, Profile> = {
  minimum: Profile.MINIMUM,
  basicwl: Profile.BASIC_WL,
  basic: Profile.BASIC,
  en16931: Profile.EN16931,
  extended: Profile.EXTENDED,
};

/**
 * Maps a CII guideline URN to its profile. The profile is the last URN segment
 * (`…:1p0:basicwl`); plain EN 16931 and its CIUS such as XRechnung
 * (`urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0`) have none.
 */
export function profileFromGuideline(guideline: string | undefined): Profile | undefined {
  if (!guideline) return undefined;
  const suffix = guideline.split(":").at(-1)?.toLowerCase() ?? "";
  return (
    PROFILE_BY_SUFFIX[suffix] ??
    (guideline.startsWith("urn:cen.eu:en16931:2017") ? Profile.EN16931 : undefined)
  );
}

type EnvName = "S2" | "PROD";
type Region = "AU" | "NZ";

export function getCredentials(env: EnvName, region: Region) {
  const suffix = region === "AU" ? "" : "_NZ";

  const email = process.env[`${env}_EMAIL${suffix}`];
  const password = process.env[`${env}_PASSWORD${suffix}`];

  if (!email || !password) {
    throw new Error(`Missing credentials for ${env} ${region}`);
  }

  return { email, password };
}

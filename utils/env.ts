type EnvName = "S2" | "PROD";
type Region = "AU" | "NZ";

export function getBaseUrl(env: EnvName, region: Region): string {
  const key = region === "AU" ? `${env}_BASE_URL` : `${env}_BASE_URL_NZ`;
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing env var: ${key}`);
  }

  return value;
}

export function getCredentials(env: EnvName, region: Region) {
  const suffix = region === "AU" ? "" : "_NZ";

  const email = process.env[`${env}_EMAIL${suffix}`];
  const password = process.env[`${env}_PASSWORD${suffix}`];

  if (!email || !password) {
    throw new Error(`Missing credentials for ${env} ${region}`);
  }

  return { email, password };
}

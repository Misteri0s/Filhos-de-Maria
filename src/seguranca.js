// ---------------------------------------------------------------- senhas ----
export const SENHA_MIN = 8, SENHA_MAX = 72;

export function b64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }

export function deB64(s) { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }

export function iguais(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function derivar(senha, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256));
}
// formato novo: v2$sal$hash (sal aleatório por usuário)

// formato novo: v2$sal$hash (sal aleatório por usuário)
export async function hashSenha(senha) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return "v2$" + b64(salt) + "$" + b64(await derivar(senha, salt));
}
// confere senhas do formato novo e do antigo (sal fixo, só para contas já existentes)

// confere senhas do formato novo e do antigo (sal fixo, só para contas já existentes)
export async function conferirSenha(senha, guardado) {
  if (typeof senha !== "string" || !guardado) return { ok: false };
  if (guardado.startsWith("v2$")) {
    const [, s, h] = guardado.split("$");
    return { ok: iguais(b64(await derivar(senha, deB64(s))), h), legado: false };
  }
  const antigo = b64(await derivar(senha, new TextEncoder().encode("filhosdemaria-salt")));
  return { ok: iguais(antigo, guardado), legado: true };
}

export function validarSenha(senha, usuario) {
  if (typeof senha !== "string" || senha.length < SENHA_MIN) return "A senha precisa ter pelo menos " + SENHA_MIN + " caracteres.";
  if (senha.length > SENHA_MAX) return "A senha pode ter no máximo " + SENHA_MAX + " caracteres.";
  if (usuario && senha.toLowerCase() === usuario.toLowerCase()) return "A senha não pode ser igual ao usuário.";
  return null;
}

export async function gerarSenha() {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 12; i++) s += chars[arr[i] % chars.length];
  return s;
}

// -------------------------------------------- bloqueio por tentativas ----
// Se a tabela "tentativas" não existir, tudo isto é ignorado (o login continua funcionando).

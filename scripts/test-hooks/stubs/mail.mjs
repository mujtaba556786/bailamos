// Records every mail instead of sending it. Set globalThis.__mailFail = true to simulate an SMTP failure.
export async function sendMail(_env, message) {
  if (globalThis.__mailFail) throw new Error("smtp down");
  (globalThis.__mails ||= []).push(message);
}

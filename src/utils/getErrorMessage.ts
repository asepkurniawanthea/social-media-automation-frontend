import axios from "axios";

export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const msg: unknown = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string" && msg) return msg;
    return fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

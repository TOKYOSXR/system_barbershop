/** Standard result shape returned by Server Actions to the client. */
export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

/** Wraps an action body, converting thrown errors into a friendly result. */
export async function runAction<T>(
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    // Never leak technical errors to the user (section 39).
    if (error instanceof Error && error.name === "ForbiddenError") {
      return { success: false, error: error.message };
    }
    console.error("Server action failed:", error);
    return {
      success: false,
      error: "Ocorreu um erro. Tente novamente.",
    };
  }
}

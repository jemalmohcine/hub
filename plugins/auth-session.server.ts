export default defineNuxtPlugin({
  name: "auth-session-sync",
  enforce: "post",
  dependsOn: ["supabase"],
  async setup() {
    await syncSupabaseAuthState();
  },
});

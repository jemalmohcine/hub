<script setup lang="ts">
const route = useRoute();
await navigateTo({
  path: "/auth/sign-up",
  query: route.query,
  replace: true,
});
</script>

<script setup lang="ts">
const route = useRoute();
await navigateTo({
  path: "/auth/login",
  query: route.query,
  replace: true,
});
</script>

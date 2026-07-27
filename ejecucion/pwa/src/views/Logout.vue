<template>
  Logout
</template>
<script setup>
//import useProfileStore from "@/store/profile.js";
import { useRouter } from "vue-router";
import { useUserDetailStore } from "@/store/userDetail";

/* eslint-disable */
const router = useRouter();
const userDetailStore = useUserDetailStore()
//const profileStore = useProfileStore();
//profileStore.auth = false;

const perfilStorage = localStorage.getItem('perfil');

if (perfilStorage !== null) {
  const perfil = JSON.parse(perfilStorage);

  if (perfil.auth) {
    perfil.auth = false;
    localStorage.setItem('perfil', JSON.stringify(perfil));
  }
}

localStorage.removeItem('token')
sessionStorage.removeItem('token')
localStorage.removeItem('rolesIds')
localStorage.removeItem('rolesNames')
localStorage.removeItem('isLogin')
localStorage.removeItem('hasRole13')
localStorage.removeItem('isExternalCompany')
localStorage.removeItem('userDetail')

userDetailStore.userDetail = null

router.replace({
  name: 'login',
});
</script>
<style scoped></style>

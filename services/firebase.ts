import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// CONFIGURAÇÃO OBRIGATÓRIA DO FIREBASE
// O erro ao fazer login acontece porque você ainda não configurou estas chaves.
//
// PASSO A PASSO PARA CORRIGIR:
// 1. Acesse https://console.firebase.google.com/
// 2. Crie um novo projeto (ex: "romaneios-app")
// 3. No menu esquerdo, vá em "Criação" > "Authentication" e ative o provedor "Email/Senha".
// 4. No menu esquerdo, vá em "Criação" > "Firestore Database" e crie um banco de dados (modo de teste).
// 5. Clique na engrenagem (Configurações do Projeto) > Geral.
// 6. Em "Seus aplicativos", clique no ícone "</>" (Web).
// 7. Copie as chaves geradas e cole abaixo, substituindo os textos entre aspas.
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI", // Ex: "AIzaSy..."
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Validação simples para avisar no console
if (firebaseConfig.apiKey === "SUA_API_KEY_AQUI") {
  console.error("ERRO CRÍTICO: As chaves do Firebase não foram configuradas em 'services/firebase.ts'. O login falhará.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
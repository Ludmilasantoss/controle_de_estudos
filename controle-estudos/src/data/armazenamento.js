// Adaptadores de armazenamento. O repositório só conhece esta interface:
//   ler()  → objeto do banco ou null
//   gravar(banco)
//   limpar()
// Para trocar por Supabase, substitua o repositório inteiro (as telas só usam o repositório).

export const CHAVE_PADRAO = 'controle-estudos:v1';

export function criarArmazenamentoLocal(chave = CHAVE_PADRAO) {
  return {
    ler() {
      try {
        const texto = window.localStorage.getItem(chave);
        return texto ? JSON.parse(texto) : null;
      } catch {
        return null;
      }
    },
    gravar(banco) {
      window.localStorage.setItem(chave, JSON.stringify(banco));
    },
    limpar() {
      window.localStorage.removeItem(chave);
    },
  };
}

/** Usado nos testes: guarda tudo em memória. */
export function criarArmazenamentoMemoria(inicial = null) {
  let banco = inicial ? structuredClone(inicial) : null;
  return {
    ler: () => (banco ? structuredClone(banco) : null),
    gravar: (novo) => {
      banco = structuredClone(novo);
    },
    limpar: () => {
      banco = null;
    },
  };
}

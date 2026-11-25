import { useCallback, useEffect, useState } from 'react';

/**
 * Carrega dados assíncronos do repositório.
 * Devolve { dados, carregando, erro, recarregar }.
 */
export function useCarregar(funcao, dependencias = []) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const carregar = useCallback(funcao, dependencias);

  const recarregar = useCallback(async () => {
    try {
      const dados = await carregar();
      setEstado({ dados, carregando: false, erro: null });
    } catch (erro) {
      console.error(erro);
      setEstado({ dados: null, carregando: false, erro });
    }
  }, [carregar]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { ...estado, recarregar };
}

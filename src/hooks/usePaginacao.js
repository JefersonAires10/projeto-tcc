import { useState } from 'react';

export default function usePaginacao(porPagina = 10) {
  const [pagina, setPag] = useState(1);

  function calcular(items) {
    const total = Math.max(1, Math.ceil((items || []).length / porPagina));
    const atual = pagina > total ? total : pagina;
    const exibidos = (items || []).slice((atual - 1) * porPagina, atual * porPagina);
    return { pagina: atual, totalPag: total, exibidos };
  }

  return { pagina, setPag, calcular, porPagina };
}

// Validação SUAVE e não bloqueante (§4). Nunca impede salvar: no máximo
// retorna um aviso discreto quando o formato parece estranho.

export function cpfHint(cpf?: string): string | undefined {
  if (!cpf) return undefined;
  const d = cpf.replace(/\D/g, '');
  if (d.length === 0) return undefined;
  if (d.length !== 11) return 'CPF costuma ter 11 dígitos (você ainda pode salvar).';
  if (/^(\d)\1{10}$/.test(d)) return 'CPF parece inválido (você ainda pode salvar).';
  // dígitos verificadores
  const calc = (base: string, pesoIni: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoIni - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  if (calc(d.slice(0, 9), 10) !== Number(d[9]) || calc(d.slice(0, 10), 11) !== Number(d[10]))
    return 'CPF parece inválido (você ainda pode salvar).';
  return undefined;
}

export function emailHint(email?: string): string | undefined {
  if (!email) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'E-mail parece incompleto (você ainda pode salvar).';
  return undefined;
}

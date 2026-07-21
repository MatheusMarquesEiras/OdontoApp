# Como lançar uma atualização do OdontoApp

O app tem **atualização automática**: quando você publica uma nova versão, o
aplicativo instalado (no PC da sua tia, por exemplo) mostra sozinho o aviso
*"Nova versão disponível — Atualizar agora?"*. Ela clica em **Atualizar agora** e
pronto. **Os dados e a senha dela são preservados** (ficam numa pasta separada da
instalação).

## Passo a passo para lançar uma nova versão

1. Faça suas alterações no código.
2. **Suba o número da versão** nos três arquivos (todos com o mesmo número):
   - `src-tauri/tauri.conf.json` → `"version"`
   - `package.json` → `"version"`
   - `src-tauri/Cargo.toml` → `version`
3. Faça o commit das mudanças.
4. Crie e envie a **tag** com a versão (começando com `v`):

   ```bash
   git tag v1.3.0
   git push --tags
   ```

5. O **GitHub Actions** compila, assina e publica a Release sozinho (~5–10 min).
6. Na próxima vez que sua tia abrir o app, aparece o aviso de atualização.

> Não precisa mais ir até o computador dela nem mandar arquivo por WhatsApp.

## Configuração (feita uma única vez)

- **Repositório público** (ou hospedagem pública das releases) para o app baixar a
  atualização sem senha.
- Dois **segredos** no repositório (Settings → Secrets and variables → Actions):
  - `TAURI_SIGNING_PRIVATE_KEY` → conteúdo do arquivo de chave privada
    (`C:\Users\mathe\.tauri\odontoapp_updater.key`).
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` → **vazio** (a chave foi gerada sem senha).

⚠️ **Guarde a chave privada com cuidado.** Se ela for perdida, as atualizações
param de funcionar até gerar uma nova chave e reinstalar uma versão nova
manualmente.

## Observações

- A **primeira** instalação (a versão 1.2.0 em diante, que já tem o atualizador)
  precisa ser feita manualmente uma vez. A partir daí, tudo é automático.
- O **aviso azul do Windows** só aparece nessa primeira instalação manual. As
  atualizações automáticas seguintes passam sem esse aviso.
- Recomende manter o **backup automático** ligado, como rede de proteção.

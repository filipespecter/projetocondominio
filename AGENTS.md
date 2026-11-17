# InfinityCondo — regras de alteração

Antes de editar código, gerar arquivos, preparar um pacote ou orientar comandos de alteração, ler este arquivo, conferir o pedido e o estado atual do projeto. Informar escopo e arquivos envolvidos.

- Alterar somente o pedido e suas dependências necessárias. Não adicionar melhorias, refatorações, limpezas ou dependências sem necessidade demonstrada.
- Não alterar outras telas, aparência, navegação, textos ou comportamentos sem autorização. Se uma dependência exigir outra tela, explicar o impacto e obter autorização antes.
- Preservar fluxos validados, dados, permissões, isolamento entre condomínios, geração e validação de retirada e auditoria.
- Não enfraquecer autenticação, limites, validações ou testes para concluir uma implementação.
- Não expor credenciais, arquivos .env, dados pessoais ou QR de conexão em respostas, GitHub, pacotes ou logs.
- Não executar reset, seed, exclusão, restauração ou migração fora do escopo autorizado. Informar impacto e recuperação antes de qualquer migração necessária.
- Trabalhar primeiro na Homolog. Commit, push, main e VPS dependem de autorização explícita para a respectiva ação.
- Manter somente o backup mais recente de código e o de banco nos locais definidos. Validar o novo antes de substituir o anterior. Não espalhar cópias pela Área de Trabalho.
- Conferir o diff e executar testes proporcionais. Distinguir teste automatizado, banco, visual e entrega real. Não prometer ausência de falhas.
- Pacotes devem conferir compatibilidade antes de escrever, interromper em divergência, preservar alterações locais e orientar aplicação, validação e recuperação.
- Relatar arquivos alterados, evidências, limitações e validações pendentes. Não afirmar igualdade visual ou integração funcionando sem comprovar.
- Problemas fora do pedido devem ser relatados separadamente, sem correção automática.

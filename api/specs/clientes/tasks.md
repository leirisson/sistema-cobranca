# Tasks — Clientes (CAD)

> Sprint 1 concluída. Ver `api/sprints/sprint-01-clientes.md` para o registro da execução.
> MVP v1.2 (enriquecimento de cadastro) adicionado — ver `api/mvp-v1/mvp v1.2.md`.

- [x] CAD-01 — Implementar `Cliente` (entidade) + `CriarClienteUseCase`
- [x] CAD-02 — Validar telefone (E.164) e dia de vencimento (1–28) na entidade `Cliente`
- [x] CAD-03 — Implementar `InativarClienteUseCase`
- [x] CAD-04 — Implementar `EditarClienteUseCase`
- [x] CAD-05 — Implementar `ClienteRepository.buscarPorNome`
- [x] CAD-06 — Tornar `documento` obrigatório com validação de formato CPF (11 dígitos) ou CNPJ (14 dígitos)
- [x] CAD-07 — Migrar `telefone` (string única) para `telefones` (lista, 1 obrigatório marcado `principal`)
- [x] CAD-08 — Adicionar campos opcionais: `inscricaoEstadual`, `endereco`, `nomeContato`, `referenciaServico`

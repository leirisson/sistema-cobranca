# Regras — Contrato de API (API)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Natureza do módulo

Este módulo não introduz entidade, use case ou regra de negócio nova — ele documenta,
em `endpoints.md`, o contrato das rotas HTTP que já existem (ou serão criadas) nos demais
módulos. É trabalho de especificação/documentação, não de implementação.

## Convenção de formato do `endpoints.md`

Cada rota documentada segue o template:

```
### `<MÉTODO> <path>`
- **Módulo:** <prefixo, ex: CAD>
- **Autenticação:** Pública | Protegida (JWT)
- **Request:** query params / body (com tipos)
- **Response 2xx:** shape do corpo
- **Erros:** lista de status code + condição
```

## Formato padrão de erro

- Erro de validação ou regra de negócio: `400 { error: string }` — mensagem vem da entidade/use case, nunca stack trace
- Não autenticado / token inválido ou expirado: `401 { error: string }`
- Recurso não encontrado: `404` (corpo vazio ou `{ error: string }`, conforme já implementado por rota)
- Nunca vazar detalhe de implementação (nome de tabela, stack trace) em qualquer resposta de erro

## Fora de escopo

- OpenAPI/Swagger automático
- Versionamento de rota
- Client SDK gerado

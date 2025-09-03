# Dockerfiles: por que cada serviço tem o seu

Resumo
Cada microserviço (transaction-api e notification-service) tem o seu Dockerfile porque:
- Dependências diferentes: cada serviço tem pacotes e versões distintas.
- Otimização por serviço: multi-stage build, camadas de cache e tamanho da imagem podem ser ajustados individualmente.
- Isolamento e segurança: cada imagem contém apenas o runtime necessário para aquele serviço.
- Ciclo de vida independente: permite versionar, construir e deployar imagens separadamente.
- Facilita CI/CD e rollbacks por serviço.

Como construir localmente
- Transaction API:
  docker build -t transaction-api:local ./transaction-api
- Notification Service:
  docker build -t notification-service:local ./notification-service

Como rodar localmente com docker-compose
- Na raiz `swap/`:
  docker-compose up --build

Alternativa
- Monorepo com um Dockerfile multi-target ou root Dockerfile: possível, mas reduz isolação e complica builds quando serviços divergem.
- Recomendo manter um Dockerfile por serviço para microservices.

Onde estão os Dockerfiles
- swap/transaction-api/Dockerfile
- swap/notification-service/Dockerfile

Notas para apresentação
- Mostre o Dockerfile de cada serviço com foco nas otimizações (multi-stage, non-root user, healthcheck).
- Demonstre `docker-compose up --build` para iniciar ambos localmente.

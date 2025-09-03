# Plataforma Fintech com Crossplane

## Contexto

Este projeto foi desenvolvido como parte de um desafio técnico para criar uma infraestrutura cloud-native para uma fintech que processa transações financeiras de forma segura e escalável.

## Objetivo

Desenvolver uma solução completa usando Crossplane para provisionar e gerenciar uma aplicação composta por dois microserviços na AWS, demonstrando expertise em IaC, containers e Kubernetes.

## Arquitetura

A solução inclui:
- **Infraestrutura AWS**: Provisionada via Crossplane, com VPC, EKS, RDS PostgreSQL, ElastiCache Redis, ALB, Route53, AWS Secrets Manager e CloudWatch.
- **Microserviços**:
  - **Transaction API Service**: API de transações com endpoints para criar e consultar transações.
  - **Notification Service**: Serviço de notificações que recebe webhooks da Transaction API.
- **Kubernetes**: Deployments com rolling updates, HPA, NetworkPolicies, ConfigMaps e Secrets.
- **Observabilidade**: Prometheus, Grafana, ELK Stack e alertas configurados.
- **Segurança**: HTTPS end-to-end, Pod Security Standards e AWS Secrets Manager.

## Documentação

- [Instalação](INSTALLATION.md)
- [Uso](USAGE.md)
- [Contribuindo](CONTRIBUTING.md)
- [Registro de Alterações](CHANGELOG.md)
- [Licença](LICENSE.md)

## Licença

Este projeto está licenciado sob os termos da [LICENÇA](LICENSE.md).

DESAFIO TÉCNICO: CROSSPLANE FINTECH PLATFORM
Contexto
Você foi contratado para criar uma infraestrutura cloud-native para uma fintech que precisa processar transações financeiras de forma segura e escalável.

Objetivo
Desenvolver uma solução completa usando Crossplane que provisione e gerencie uma aplicação de dois microserviços na AWS, demonstrando expertise em IaC, containers e Kubernetes.

Arquitetura Requerida
A solução deve contemplar uma stack completa de infraestrutura AWS provisionada via Crossplane, com dois microserviços containerizados executando em Kubernetes.

Infraestrutura via Crossplane
A infraestrutura base deve incluir uma VPC com subnets públicas e privadas, um cluster EKS com node groups otimizados, uma instância RDS PostgreSQL em configuração Multi-AZ para alta disponibilidade, um cluster ElastiCache Redis para cache e sessões, um Application Load Balancer para distribuição de tráfego, configuração de DNS via Route53, gerenciamento de credenciais através do AWS Secrets Manager e observabilidade via CloudWatch.

Transaction API Service
O primeiro microserviço deve ser uma API de transações implementada em Python, Node.js ou Go (sua escolha de framework correspondente: FastAPI, Express ou Gin). O serviço deve expor na porta 8080 e implementar três endpoints principais: POST /transactions para criar transações, GET /transactions/{id} para buscar transações específicas e GET /health para verificação de saúde. Deve utilizar PostgreSQL como banco de dados principal e Redis para cache de resultados de queries, melhorando a performance das consultas.

Notification Service
O segundo microserviço é um serviço de notificações, também implementado na linguagem e framework de sua escolha, executando na porta 8081. Deve expor POST /notify para enviar notificações, GET /notifications/{user_id} para buscar notificações de usuários específicos e GET /health para monitoramento. Este serviço deve receber webhooks do Transaction API quando novas transações são criadas e utilizar a mesma instância PostgreSQL, porém com schema separado.

Arquitetura do Sistema
Requisitos Técnicos
Crossplane Configuration
A configuração do Crossplane deve incluir uma Composition customizada para provisionar toda a stack de infraestrutura de forma declarativa. Você deve criar uma CompositeResourceDefinition (XRD) bem estruturada que defina os parâmetros e especificações da sua plataforma fintech. O Provider AWS deve estar configurado com IAM roles apropriadas seguindo o princípio de menor privilégio. Todos os recursos AWS devem ser gerenciados como Managed Resources com dependências corretas entre componentes, garantindo que a ordem de provisionamento seja respeitada.

Kubernetes Manifests
Os deployments devem implementar estratégias de rolling update para atualizações sem downtime. Configure services apropriados para service discovery entre os microserviços. Implemente um Ingress com terminação SSL/TLS automática. Utilize ConfigMaps para configurações não sensíveis e Secrets para dados confidenciais. Configure HPA (Horizontal Pod Autoscaler) para escalabilidade automática baseada em métricas. Implemente NetworkPolicies para isolamento e segurança de rede. Configure ServiceAccounts com RBAC apropriado para cada componente.

Docker & Containers
Desenvolva multi-stage builds otimizados para reduzir o tamanho das imagens finais. Configure os containers para executar com usuários não-root por segurança. Implemente health checks robustos nos containers. Defina resource limits apropriados para CPU e memória. Como bonus, inclua security scanning com ferramentas como Trivy ou Snyk.

Comunicação Entre Serviços
Implemente service discovery nativo do Kubernetes ou um service mesh como Istio para comunicação entre serviços. Configure circuit breakers para resiliência. Defina retry policies apropriadas para chamadas entre serviços. Implemente distributed tracing com Jaeger ou Zipkin para observabilidade de requests. Configure webhooks do Transaction API para o Notification Service quando transações são processadas.

Observabilidade & Monitoring
Configure Prometheus para coleta de métricas e Grafana para visualização. Implemente ELK Stack ou Fluentd para agregação e análise de logs. Desenvolva custom metrics específicas das aplicações (transações por segundo, latência de notificações, etc). Configure alerts no Grafana para métricas críticas de negócio. Crie dashboards com métricas relevantes para uma fintech.

Segurança
Gerencie todas as credenciais através do AWS Secrets Manager integrado com o Kubernetes. Configure network segmentation apropriada com Security Groups restritivos. Implemente HTTPS end-to-end em toda a comunicação. Aplique Pod Security Standards para hardening dos containers. Como bonus, implemente vulnerability scanning nos containers antes do deploy.

Cenários de Troubleshooting
Database Connection Issues
Simule um problema de conectividade com o RDS PostgreSQL e documente detalhadamente como você identificaria o problema, quais passos de troubleshooting executaria, qual solução implementaria e como preveniria problemas similares no futuro. Considere cenários como security groups incorretos, DNS resolution, connection pooling e timeouts.

Pod Crash Loop
Configure intencionalmente um dos pods para entrar em crash loop (pode ser por configuração incorreta, falta de recursos, etc) e documente sua análise dos logs do Kubernetes, os passos de debugging executados, a root cause analysis realizada e o fix implementado. Demonstre conhecimento de kubectl, logs de containers e debugging de aplicações.

Performance Degradation
Simule alta latência entre os serviços e demonstre como identificaria gargalos de performance, quais ferramentas de profiling utilizaria (APM, métricas de rede, etc), que otimizações implementaria e como estabeleceria monitoring contínuo para prevenir degradação futura.

Estrutura de Entrega
Organize seu repositório com as seguintes estruturas: um diretório crossplane contendo providers, compositions, xrds e instances. Um diretório k8s com namespaces, apps (subdividido em transaction-api e notification-service), monitoring e security. Um diretório docker com os Dockerfiles de cada serviço. Um diretório docs com arquiteturas, deployment, troubleshooting e documentação de API. Um diretório scripts com automação de deploy, testes e cleanup.

fintech-platform/
├── crossplane/
│   ├── providers/
│   ├── compositions/
│   ├── xrds/
│   └── instances/
├── k8s/
│   ├── namespaces/
│   ├── apps/
│   │   ├── transaction-api/
│   │   └── notification-service/
│   ├── monitoring/
│   └── security/
├── docker/
│   ├── transaction-api/
│   └── notification-service/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── TROUBLESHOOTING.md
│   └── API.md
├── scripts/
│   ├── deploy.sh
│   ├── test.sh
│   └── cleanup.sh
└── README.md

Templates Básicos
Para facilitar o início do projeto, fornecemos templates básicos para os principais componentes:

1. **Crossplane Composition**:
   ```yaml
   apiVersion: apiextensions.crossplane.io/v1
   kind: Composition
   metadata:
     name: fintech-platform
   spec:
     compositeTypeRef:
       apiVersion: platform.fintech/v1alpha1
       kind: FintechPlatform
     resources:
       - name: vpc
         base:
           apiVersion: ec2.aws.crossplane.io/v1beta1
           kind: VPC
           spec:
             forProvider:
               cidrBlock: "10.0.0.0/16"
   ```

2. **Kubernetes Deployment**:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: transaction-api
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: transaction-api
     template:
       metadata:
         labels:
           app: transaction-api
       spec:
         containers:
           - name: transaction-api
             image: your-dockerhub/transaction-api:latest
             ports:
               - containerPort: 8080
   ```

3. **Dockerfile**:
   ```dockerfile
   FROM node:16-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM node:16-alpine
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   CMD ["node", "dist/index.js"]
   ```

Etapas Sugeridas
Para facilitar a execução, siga estas etapas:
1. Configure o Crossplane e provisione a infraestrutura base.
2. Desenvolva e teste os microserviços localmente.
3. Crie os manifests do Kubernetes e implemente no cluster.
4. Configure observabilidade e segurança.
5. Documente troubleshooting e finalize a entrega.

Exemplos de APIs
1. **Transaction API**:
   - `POST /transactions`:
     ```json
     {
       "user_id": "123",
       "amount": 100.50,
       "currency": "USD"
     }
     ```
   - `GET /transactions/{id}`:
     ```json
     {
       "id": "txn_001",
       "user_id": "123",
       "amount": 100.50,
       "currency": "USD",
       "status": "completed"
     }
     ```

2. **Notification Service**:
   - `POST /notify`:
     ```json
     {
       "user_id": "123",
       "message": "Transaction completed successfully."
     }
     ```
   - `GET /notifications/{user_id}`:
     ```json
     [
       {
         "id": "notif_001",
         "user_id": "123",
         "message": "Transaction completed successfully."
       }
     ]
     ```

Critérios de Avaliação
Nível Sênior (40% da avaliação)
Avaliamos arquitetura bem pensada e justificada tecnicamente, compositions avançadas do Crossplane demonstrando conhecimento profundo da ferramenta, implementação de padrões de design modernos e documentação técnica detalhada que demonstre raciocínio arquitetural.

Nível Pleno (35% da avaliação)
Analisamos implementação funcional completa de todos os requisitos, boa qualidade de código seguindo boas práticas, testes automatizados cobrindo cenários importantes e configurações de segurança implementadas corretamente.

Conceitos Básicos (25% da avaliação)
Verificamos se os containers estão funcionais e bem construídos, deploy correto no Kubernetes, comunicação efetiva entre serviços e scripts de automação funcionais.

Bonus Points
Considere implementar GitOps com ArgoCD ou Flux para deployment contínuo. Chaos Engineering com Chaos Monkey para testes de resiliência. Load testing com K6 ou JMeter para validar performance. Infrastructure tests com Terratest para validar a infraestrutura. Pipeline completo de CI/CD. Demonstração de cost optimization na AWS.

Como Entregar
Crie um repositório público no GitHub com toda a solução. Inclua um README.md detalhado explicando como executar o projeto do zero, as decisões arquiteturais tomadas com suas justificativas, os desafios encontrados durante o desenvolvimento e as soluções implementadas. Envie o link do repositório para foundation-jobs@contaswap.com com o assunto "Desafio Crossplane - [Seu Nome]".

Prazo e Suporte
Prazo: até 5 dias úteis, mas pode entregar antes! Importante: NÃO precisa estar 100% completo para enviar. Preferimos receber uma solução parcial bem executada do que não receber nada. Este é um processo seletivo competitivo - os primeiros a entregar (mesmo que parcialmente) terão prioridade nas entrevistas

Pronto para mostrar seu talento? Vamos construir o futuro das fintechs juntos!

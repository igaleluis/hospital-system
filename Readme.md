MedControl - Hospital System DevOps Project
Descripción

MedControl es un sistema web para la gestión de pacientes en una sala de emergencias hospitalaria. El proyecto fue desarrollado utilizando Spring Boot, MySQL y Docker, implementando prácticas DevOps para automatizar despliegues, monitoreo y seguridad en infraestructura cloud.

La aplicación fue desplegada en Google Cloud Platform utilizando contenedores Docker y Docker Compose, integrando herramientas de CI/CD, monitoreo y seguridad.

Tecnologías Utilizadas
Backend
Java 21
Spring Boot
Spring Data JPA
Maven
Frontend
HTML
CSS
JavaScript
Bootstrap
Base de Datos
MySQL 8
Contenedores
Docker
Docker Compose
CI/CD
GitHub Actions
Docker Hub
Monitoreo
Prometheus
Grafana
Seguridad
Nginx
HTTPS
Certbot
Let’s Encrypt
Trivy
Cloud
Google Cloud Platform (GCP)
Ubuntu Linux VM
DuckDNS
Arquitectura

El sistema utiliza una arquitectura basada en contenedores Docker desplegados en una máquina virtual de Google Cloud Platform.

Servicios principales:

Frontend Web
Backend Spring Boot
MySQL
Prometheus
Grafana
Nginx Reverse Proxy
CI/CD

El proyecto implementa integración y despliegue continuo mediante GitHub Actions.

Pipeline automatizado:

Build del proyecto Maven
Construcción de imagen Docker
Escaneo de vulnerabilidades con Trivy
Push a Docker Hub
Deploy automático a Google Cloud vía SSH
Ejecución Local
Clonar repositorio
git clone TU_REPOSITORIO
cd hospital-system
Ejecutar contenedores
docker-compose up -d
Acceso al Sistema

Sistema principal:

https://hospital-proyecto-luis.duckdns.org

Grafana:

http://IP_VM:3000

Prometheus:

http://IP_VM:9090

Variables y Secrets

El proyecto utiliza GitHub Secrets para proteger información sensible:

Docker Hub credentials
SSH private key
VM IP
VM username
Monitoreo

Prometheus recolecta métricas de la aplicación Spring Boot y Grafana visualiza dashboards en tiempo real.

Seguridad

Se implementó HTTPS mediante Certbot y Let’s Encrypt.

También se integró Trivy para escaneo automático de vulnerabilidades en imágenes Docker.

Autor

Luis Alejandro López López
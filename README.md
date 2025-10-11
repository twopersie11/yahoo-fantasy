# yahoo-fantasy-basketball
[![Build Status](https://app.travis-ci.com/wcrasta/yahoo-fantasy-basketball.svg?branch=master)](https://app.travis-ci.com/wcrasta/yahoo-fantasy-basketball)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=wcrasta_yahoo-fantasy-basketball&metric=alert_status)](https://sonarcloud.io/dashboard?id=wcrasta_yahoo-fantasy-basketball)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=wcrasta_yahoo-fantasy-basketball&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=wcrasta_yahoo-fantasy-basketball)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=wcrasta_yahoo-fantasy-basketball&metric=coverage)](https://sonarcloud.io/dashboard?id=wcrasta_yahoo-fantasy-basketball)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=wcrasta_yahoo-fantasy-basketball&metric=sqale_index)](https://sonarcloud.io/dashboard?id=wcrasta_yahoo-fantasy-basketball)
## Table of Contents
* [Overview](#overview)
* [Local Setup](#local-setup)
* [Contributing](#contributing)
* [Tech Stack](#tech-stack)

## Overview
https://yahoofantasy.warrencrasta.com

An application that calculates and displays various statistics that Yahoo doesn't show by default for Fantasy Basketball leagues. The ESPN equivalent is [here](https://github.com/wcrasta/ESPN-Fantasy-Basketball).

If you liked this project, please consider starring the repository.

## Local Setup
1. Create an app in [Yahoo Developer](https://developer.yahoo.com/apps/). Set the **Redirect URI** to `https://localhost:8443/login/oauth2/code/yahoo`. Choose **Fantasy Sports: Read** and **Open ID Connect Permissions: Email and Profile** (which also enables the required **openid** scope) from the permissions.
1. Ensure you have [Git](https://git-scm.com/), [Apache Maven](https://maven.apache.org/), and Java 11 installed on your machine.
1. Clone this project. It is a Spring Boot project that you can run either in an IDE or on the command line. From the root directory of the project: `mvn clean install`. Ensure that you have the **-Dspring.profiles.active=localhost** VM option set.
1. Replace the `spring.security.oauth2.client.registration.yahoo.client-id` and `spring.security.oauth2.client.registration.yahoo.client-secret` values in `application-localhost.properties` with the ones from your app in Step (1).
1. Start the application. You need Spring Boot to run on HTTPS using a self-signed certificate (which the project does by default). A dummy self-signed certificate is included in the `src/main/resources` directory.
1. In a browser, go to https://localhost:8443. Your browser might say that it is unsafe, but bypass those warnings.

## Quickstart (Node OAuth backend)

For a lightweight OAuth-focused workflow, the repository now ships with a standalone Express/TypeScript backend under `server/` that proxies Yahoo Fantasy OAuth and API calls over HTTPS.

1. Create or update your [Yahoo Developer app](https://developer.yahoo.com/apps/) and add `https://localhost:8443/login/oauth2/code/yahoo` as an authorized **Redirect URI**. Ensure the scopes include **Fantasy Sports - Read** plus **Profile** and **Email** (which implicitly adds the **openid** scope Yahoo requires when requesting profile or email data).
2. `cd server`
3. `cp .env.sample .env` and populate the Yahoo credentials along with a random `SESSION_SECRET`. The default `YAHOO_SCOPE` (`openid fspt-r profile email`) matches the recommended Yahoo permissions, but you can adjust any optional overrides in this file later.
4. `npm install`
5. `npm run cert:gen` to generate `certs/dev/cert.pem` and `certs/dev/key.pem` self-signed certs for `https://localhost:8443`.
6. `npm run dev`
7. Visit `https://localhost:8443/api/health` to verify the server prints `{ ok: true }`.
8. Start the OAuth flow at `https://localhost:8443/auth/yahoo` (or `/auth/login` which redirects there), approve the Yahoo consent screen, then hit:
   * `https://localhost:8443/api/me/leagues` to fetch your NBA league payload via the Yahoo Fantasy SDK.
   * `https://localhost:8443/api/yahoo/game/nba` to see a raw sample response from `https://fantasysports.yahooapis.com/fantasy/v2/game/nba` using your bearer token.

Tokens persist in `server/.data/yahoo_tokens.json`, refresh automatically, and the backend logs the redirect URI, scope, and any Yahoo error descriptions to help with debugging. If you add a Vite/React frontend, point it at this backend by setting `VITE_API_BASE=https://localhost:8443`.

If you're considering contributing to this project:
1. Use the [Google Java Format plugin](https://github.com/google/google-java-format) for formatting your code.
1. Use [SonarLint](https://www.sonarlint.org/) to check for code quality issues.
1. A Postman collection for the Yahoo Fantasy Sports API is included in the root directory of this project. It might be helpful to you.

## Contributing
Any contributions to this project would be greatly appreciated. This project is a side hobby for me, so it may take a few days for your PR to be reviewed.

Contributions are welcome from engineers of all skill levels. If you have any questions or are interested in contributing, please submit a PR and/or e-mail me at warrencrasta@gmail.com.

## Tech Stack
* **Data:** [Yahoo Fantasy Sports API](https://developer.yahoo.com/fantasysports/guide/)
* **Back End:** Java Spring Boot & Spring Framework for API. Spring Security for OAuth. MapStruct, Lombok
* **Front End:** Thymeleaf, Bootstrap, HTML, CSS, JavaScript/jQuery, DataTables
* **Infrastructure:** Travis CI for CI/CD pipeline. AWS S3 to host artifact. AWS CodeDeploy as deployment agent. Bash script to run the artifact as a process on AWS EC2 instance. AWS IAM to manage permissions among AWS services. AWS CloudFormation for managing infrastructure-as-code.
* **Monitoring:** Google Analytics
* **Hosting:** Namecheap to host domain name. AWS EC2 to host the Tomcat web server on the cloud
* **Code Quality:** Sonar, Checkstyle for code style
* **Other:** Git for version control, Apache Maven for build management

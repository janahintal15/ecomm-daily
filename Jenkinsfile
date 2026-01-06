pipeline {
  agent any

  tools {
    nodejs 'node20'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  parameters {
    choice(
      name: 'TEST_ENV',
      choices: ['S2', 'PROD'],
      description: 'Which Playwright project to run'
    )
  }

  environment {
    // ✅ MUST be here so Playwright config sees them at startup
    S2_BASE_URL   = 'https://s2.cengagelearning.com.au'
    PROD_BASE_URL = 'https://www.cengage.com.au'

    JUNIT_FILE = 'reports/junit.xml'
    HTML_DIR   = 'playwright-report'
    PLAYWRIGHT_BROWSERS_PATH = 'D:\\Jenkins\\playwright-browsers'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        bat 'npm ci'
      }
    }

    stage('Install Playwright Browsers') {
      steps {
        bat '''
          echo Cleaning Playwright browser cache
          rmdir /s /q "%PLAYWRIGHT_BROWSERS_PATH%" 2>nul
          mkdir "%PLAYWRIGHT_BROWSERS_PATH%"

          node -v
          npm -v

          npx playwright install chromium chromium-headless-shell
        '''
      }
    }

    stage('Create .env (credentials only)') {
      steps {
        script {
          if (params.TEST_ENV == 'S2') {
            withCredentials([
              usernamePassword(
                credentialsId: 'ecom-s2-creds',
                usernameVariable: 'EMAIL',
                passwordVariable: 'PASSWORD'
              )
            ]) {
              writeFile file: '.env', text: """\
S2_EMAIL=${EMAIL}
S2_PASSWORD=${PASSWORD}
"""
            }
          } else {
            withCredentials([
              usernamePassword(
                credentialsId: 'ecom-prod-creds',
                usernameVariable: 'EMAIL',
                passwordVariable: 'PASSWORD'
              )
            ]) {
              writeFile file: '.env', text: """\
PROD_EMAIL=${EMAIL}
PROD_PASSWORD=${PASSWORD}
"""
            }
          }
        }
      }
    }

    stage('Run Playwright') {
      steps {
        bat """
          npx playwright test --project=${params.TEST_ENV}
        """
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: "${JUNIT_FILE}"

      publishHTML(target: [
        reportDir: "${HTML_DIR}",
        reportFiles: 'index.html',
        allowMissing: true,
        keepAll: true,
        reportName: 'Playwright HTML Report'
      ])

      archiveArtifacts artifacts: "test-results/**/*, ${HTML_DIR}/**/*, ${JUNIT_FILE}",
                       allowEmptyArchive: true
    }
  }
}

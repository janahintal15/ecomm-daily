pipeline {
  agent any

  tools { nodejs 'node20' }

  triggers {
    parameterizedCron('''
    TZ=Australia/Sydney
    0 6 * * * %TEST_ENV=PROD
    ''')
  }

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
  }

  parameters {
    choice(name: 'TEST_ENV', choices: ['S2', 'PROD'], description: 'Which Playwright project to run')
    string(name: 'TAGS', defaultValue: '', description: 'Optional @tag filter (e.g., smoke)')
  }

  environment {
    JUNIT_FILE = 'reports/junit.xml'
    HTML_DIR   = 'playwright-report'
    PLAYWRIGHT_BROWSERS_PATH = 'D:\\Jenkins\\playwright-browsers'
    RECIPIENTS = 'janah.intal@ibc.com.au'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: '*/main']],
          extensions: [[$class: 'WipeWorkspace']],
          userRemoteConfigs: [[url: 'https://github.com/janahintal15/ecomm-daily.git']],
          changelog: false
        ])
      }
    }

    stage('Install Dependencies') {
      steps {
        bat 'npm ci'
      }
    }

    stage('Install Playwright Browsers') {
      steps {
        bat """
          echo Cleaning Playwright browser cache
          rmdir /s /q "${env.PLAYWRIGHT_BROWSERS_PATH}" 2>nul
          mkdir "${env.PLAYWRIGHT_BROWSERS_PATH}"

          node -v
          npm -v

          echo Installing Playwright browsers
          npx playwright install chromium chromium-headless-shell
        """
      }
    }

    stage('Verify Playwright Install') {
      steps {
        bat """
          echo Playwright version:
          npx playwright --version

          echo Installed browsers:
          dir "${env.PLAYWRIGHT_BROWSERS_PATH}"
        """
      }
    }

    stage('Create .env for selected env') {
      steps {
        script {
          if (params.TEST_ENV == 'S2') {
            withCredentials([
              usernamePassword(credentialsId: 'ecom-s2-creds', usernameVariable: 'U', passwordVariable: 'P')
            ]) {
              writeFile file: '.env', text: """\
S2_BASE_URL=https://s2.cengagelearning.com.au
PROD_BASE_URL=https://www.cengage.com.au
S2_EMAIL=${U}
S2_PASSWORD=${P}
ENV=S2
"""
            }
          } else {
            withCredentials([
              usernamePassword(credentialsId: 'ecom-prod-creds', usernameVariable: 'U', passwordVariable: 'P')
            ]) {
              writeFile file: '.env', text: """\
S2_BASE_URL=https://s2.cengagelearning.com.au
PROD_BASE_URL=https://www.cengage.com.au
PROD_EMAIL=${U}
PROD_PASSWORD=${P}
ENV=PROD
"""
            }
          }
        }
      }
    }

    // ✅ UPDATED STAGE (UNSTABLE instead of FAIL)
    stage('Run Playwright') {
      steps {
        script {
          def status = bat(
            returnStatus: true,
            script: "npx playwright test --project=${params.TEST_ENV}"
          )

          if (status != 0) {
            unstable("Playwright tests failed")
          }
        }
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

      archiveArtifacts artifacts: "test-results/**/*, ${HTML_DIR}/**/*, ${JUNIT_FILE}", allowEmptyArchive: true
    }

    success {
      script {
        if (params.TEST_ENV == 'PROD') {
          emailext(
            to: "${env.RECIPIENTS}",
            subject: "ECOMM Playwright SUCCESS #${env.BUILD_NUMBER}",
            mimeType: 'text/html',
            body: """
              <p><b>${env.JOB_NAME} #${env.BUILD_NUMBER}</b> completed successfully.</p>
              <p><a href="${env.BUILD_URL}">View build</a></p>
            """
          )
        }
      }
    }

    unstable {
      script {
        if (params.TEST_ENV == 'PROD') {
          emailext(
            to: "${env.RECIPIENTS}",
            subject: "ECOMM Playwright UNSTABLE #${env.BUILD_NUMBER}",
            mimeType: 'text/html',
            attachmentsPattern: "${JUNIT_FILE}",
            body: """
              <p><b>${env.JOB_NAME} #${env.BUILD_NUMBER}</b> is UNSTABLE (some tests failed).</p>
              <p><a href="${env.BUILD_URL}">View build</a></p>
            """
          )
        }
      }
    }

    failure {
      script {
        if (params.TEST_ENV == 'PROD') {
          emailext(
            to: "${env.RECIPIENTS}",
            subject: "ECOMM Playwright FAILED #${env.BUILD_NUMBER}",
            mimeType: 'text/html',
            attachmentsPattern: "${JUNIT_FILE}",
            body: """
              <p><b>${env.JOB_NAME} #${env.BUILD_NUMBER}</b> FAILED.</p>
              <p><a href="${env.BUILD_URL}">View build</a></p>
            """
          )
        }
      }
    }
  }
}

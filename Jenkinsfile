pipeline {
  agent any

  tools { nodejs 'node20' }

  // Run every day 06:00 Sydney time
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
    RECIPIENTS = 'janah.intal@ibc.com.au, Will.Castley@cengage.com'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: '*/main']],
          extensions: [[$class: 'WipeWorkspace']],
          userRemoteConfigs: [[
        url: 'https://github.com/janahintal15/ecomm-daily.git',
        credentialsId: 'github-pat'
        ]],
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
        script {
          if (isUnix()) {
            sh '''
              node -v
              npm -v
              npx playwright install --with-deps
            '''
          } else {
            bat """
              node -v
              npm -v
              if not exist "${env.PLAYWRIGHT_BROWSERS_PATH}" mkdir "${env.PLAYWRIGHT_BROWSERS_PATH}"
              set PLAYWRIGHT_BROWSERS_PATH=${env.PLAYWRIGHT_BROWSERS_PATH}
              npx playwright install --force
            """
          }
        }
      }
    }

    stage('Verify install') {
      steps {
        script {
          if (isUnix()) {
            sh 'ls -la node_modules/@playwright/test || echo "Playwright not found"'
          } else {
            bat 'dir node_modules\\@playwright\\test || echo Playwright not found'
          }
        }
      }
    }

  stage('Create .env for selected env') {
    steps {
      script {
        if (params.TEST_ENV == 'S2') {
          withCredentials([
            usernamePassword(credentialsId: 'ecom-s2-creds', usernameVariable: 'AU_U', passwordVariable: 'AU_P'),
            usernamePassword(credentialsId: 'ecom-s2-creds', usernameVariable: 'NZ_U', passwordVariable: 'NZ_P')
          ]) {
            writeFile file: '.env', text: """\
  S2_BASE_URL=https://s2.cengagelearning.com.au
  S2_BASE_URL_NZ=https://s2.cengagelearning.co.nz

  S2_EMAIL=${AU_U}
  S2_PASSWORD=${AU_P}

  S2_EMAIL_NZ=${NZ_U}
  S2_PASSWORD_NZ=${NZ_P}

  ENV=S2
  """
          }
        } else {
          withCredentials([
            usernamePassword(credentialsId: 'ecom-prod-creds', usernameVariable: 'AU_U', passwordVariable: 'AU_P'),
            usernamePassword(credentialsId: 'ecom-prod-creds', usernameVariable: 'NZ_U', passwordVariable: 'NZ_P')
          ]) {
            writeFile file: '.env', text: """\
  PROD_BASE_URL=https://www.cengage.com.au
  PROD_BASE_URL_NZ=https://www.cengage.co.nz

  PROD_EMAIL=${AU_U}
  PROD_PASSWORD=${AU_P}

  PROD_EMAIL_NZ=${NZ_U}
  PROD_PASSWORD_NZ=${NZ_P}

  ENV=PROD
  """
          }
        }
      }
    }
  }


    stage('Run Playwright') {
      steps {
        script {
          def tagArg = params.TAGS?.trim() ? "--grep @${params.TAGS.trim()}" : ''
          int exitCode
          if (isUnix()) {
            exitCode = sh(returnStatus: true, script: "npx playwright test --project=${params.TEST_ENV} ${tagArg}")
          } else {
            exitCode = bat(returnStatus: true, script: "npx playwright test --project=${params.TEST_ENV} ${tagArg}")
          }
          echo "Playwright exited with code ${exitCode} — continuing to publish reports."
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
        alwaysLinkToLastBuild: false,
        keepAll: true,
        reportName: 'Playwright HTML Report'
      ])

      archiveArtifacts artifacts: "test-results/**/*, ${HTML_DIR}/**/*, ${JUNIT_FILE}", allowEmptyArchive: true
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
              <p>Build: <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
              <ul>
                <li>JUnit XML attached</li>
                <li>Click <b>Playwright HTML Report</b> on the build page for screenshots/videos/traces</li>
              </ul>
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
              <p>Build: <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
              <ul>
                <li>JUnit XML attached</li>
                <li>Open <b>Playwright HTML Report</b> on the build page for details</li>
              </ul>
            """
          )
        }
      }
    }
  }
}
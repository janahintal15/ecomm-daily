pipeline {
    agent any

    tools { nodejs 'node20' }

    environment {
        // Use forward slashes or escaped backslashes for Windows paths in Jenkins
        PLAYWRIGHT_BROWSERS_PATH = 'D:/Jenkins/playwright-browsers'
        JUNIT_FILE = 'reports/junit.xml'
        HTML_DIR   = 'playwright-report'
        RECIPIENTS = 'janah.intal@ibc.com.au'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM', branches: [[name: '*/main']], extensions: [[$class: 'WipeWorkspace']], userRemoteConfigs: [[url: 'https://github.com/janahintal15/ecomm-daily.git']]])
            }
        }

        stage('Clean & Install') {
            steps {
                bat 'npm ci'
                // Force a clean install of the browser to the specific path
                bat """
                    set PLAYWRIGHT_BROWSERS_PATH=${env.PLAYWRIGHT_BROWSERS_PATH}
                    npx playwright install chromium --with-deps
                """
            }
        }

        stage('Verify Browser Path') {
            steps {
                // This helps us see in the logs if the exe actually exists
                bat """
                    dir "${env.PLAYWRIGHT_BROWSERS_PATH}" /s /b | findstr "chrome.exe" || echo "BROWSER NOT FOUND IN CUSTOM PATH"
                """
            }
        }

        stage('Create .env') {
            steps {
                script {
                    def credsId = (params.TEST_ENV == 'S2') ? 'ecom-s2-creds' : 'ecom-prod-creds'
                    withCredentials([usernamePassword(credentialsId: credsId, usernameVariable: 'U', passwordVariable: 'P')]) {
                        writeFile file: '.env', text: """
S2_BASE_URL=https://s2.cengagelearning.com.au
PROD_BASE_URL=https://www.cengage.com.au
${params.TEST_ENV}_EMAIL=${U}
${params.TEST_ENV}_PASSWORD=${P}
ENV=${params.TEST_ENV}
"""
                    }
                }
            }
        }

stage('Run Playwright') {
      steps {
        script {
          // Use 'S2' as a default if TEST_ENV is not provided (null)
          def targetProject = params.TEST_ENV ?: 'S2'
          def tagArg = params.TAGS?.trim() ? "--grep @${params.TAGS.trim()}" : ''
          
          int exitCode
          if (isUnix()) {
            exitCode = sh(returnStatus: true, script: "npx playwright test --project=${targetProject} ${tagArg}")
          } else {
            // Ensure the browser path is set and use the targetProject variable
            exitCode = bat(returnStatus: true, script: "set PLAYWRIGHT_BROWSERS_PATH=${env.PLAYWRIGHT_BROWSERS_PATH} && npx playwright test --project=${targetProject} ${tagArg}")
          }
          
          echo "Playwright exited with code ${exitCode}"
          
          // Mark as unstable if tests fail, but don't crash the whole pipeline
          if (exitCode != 0) {
              currentBuild.result = 'UNSTABLE'
          }
        }
      }
    }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: "${JUNIT_FILE}"
            publishHTML(target: [reportDir: "${HTML_DIR}", reportFiles: 'index.html', keepAll: true, reportName: 'Playwright HTML Report'])
            archiveArtifacts artifacts: "test-results/**/*, ${HTML_DIR}/**/*", allowEmptyArchive: true
        }
    }
}
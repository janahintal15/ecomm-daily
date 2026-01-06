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
                // Using 'npm install' instead of 'ci' if you need to allow package updates, 
                // but 'ci' is generally safer for Jenkins.
                bat 'npm ci'
            }
        }

        stage('Install Playwright Browsers') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            npx playwright install --with-deps --force
                        '''
                    } else {
                        bat """
                            if not exist "${env.PLAYWRIGHT_BROWSERS_PATH}" mkdir "${env.PLAYWRIGHT_BROWSERS_PATH}"
                            set PLAYWRIGHT_BROWSERS_PATH=${env.PLAYWRIGHT_BROWSERS_PATH}
                            npx playwright install --force chromium
                        """
                    }
                }
            }
        }

        stage('Verify & Debug') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npx playwright --version'
                    } else {
                        bat 'npx playwright --version'
                    }
                }
            }
        }

        stage('Create .env for selected env') {
            steps {
                script {
                    def emailCreds = (params.TEST_ENV == 'S2') ? 'ecom-s2-creds' : 'ecom-prod-creds'
                    withCredentials([usernamePassword(credentialsId: emailCreds, usernameVariable: 'U', passwordVariable: 'P')]) {
                        def envContent = """S2_BASE_URL=https://s2.cengagelearning.com.au
PROD_BASE_URL=https://www.cengage.com.au
${params.TEST_ENV}_EMAIL=${U}
${params.TEST_ENV}_PASSWORD=${P}
ENV=${params.TEST_ENV}
"""
                        writeFile file: '.env', text: envContent
                    }
                }
            }
        }

        stage('Run Playwright') {
            steps {
                script {
                    def tagArg = params.TAGS?.trim() ? "--grep @${params.TAGS.trim()}" : ''
                    int exitCode
                    // Ensure the browser path is set during the test run
                    if (isUnix()) {
                        exitCode = sh(returnStatus: true, script: "npx playwright test --project=${params.TEST_ENV} ${tagArg}")
                    } else {
                        exitCode = bat(returnStatus: true, script: "set PLAYWRIGHT_BROWSERS_PATH=${env.PLAYWRIGHT_BROWSERS_PATH} && npx playwright test --project=${params.TEST_ENV} ${tagArg}")
                    }
                    
                    if (exitCode != 0) {
                        currentBuild.result = 'UNSTABLE'
                    }
                    echo "Playwright exited with code ${exitCode}."
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

        success {
            script {
                if (params.TEST_ENV == 'PROD') {
                    sendEmail("SUCCESS", "completed successfully.")
                }
            }
        }

        unstable {
            script {
                if (params.TEST_ENV == 'PROD') {
                    sendEmail("UNSTABLE", "is UNSTABLE (some tests failed).", true)
                }
            }
        }

        failure {
            script {
                if (params.TEST_ENV == 'PROD') {
                    sendEmail("FAILED", "FAILED.", true)
                }
            }
        }
    }
}

// Helper function to keep the post section clean
def sendEmail(String status, String message, Boolean attachJunit = false) {
    emailext(
        to: "${env.RECIPIENTS}",
        subject: "ECOMM Playwright ${status} #${env.BUILD_NUMBER}",
        mimeType: 'text/html',
        attachmentsPattern: attachJunit ? "${env.JUNIT_FILE}" : "",
        body: """
            <p><b>${env.JOB_NAME} #${env.BUILD_NUMBER}</b> ${message}</p>
            <p>Build: <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
            <p>Check the Playwright HTML Report on Jenkins for details.</p>
        """
    )
}
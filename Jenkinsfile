pipeline {
    agent any

    // 1. Schedule the run for 6 AM Sydney Time
    // 'H 6 * * *' runs daily between 6:00-6:59 AM. 
    // The 'TZ' prefix ensures it respects Sydney's timezone regardless of server time.
    triggers {
        cron("""TZ=Australia/Sydney
H 6 * * *""")
    }

    tools {
        nodejs 'node20' 
    }

    parameters {
        choice(name: 'TEST_ENV', choices: ['S2', 'PROD'], description: 'Environment to run')
        string(name: 'TAGS', defaultValue: '', description: 'Optional @tag filter')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                        sh 'npx playwright install --with-deps chromium'
                    } else {
                        bat 'npm ci'
                        bat 'npx playwright install chromium'
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    def tagArg = params.TAGS?.trim() ? "--grep @${params.TAGS.trim()}" : ''
                    def playwrightArgs = "--workers=2 --retries=2"
                    
                    if (isUnix()) {
                        sh "npx playwright test --project=${params.TEST_ENV} ${tagArg} ${playwrightArgs}"
                    } else {
                        bat "npx playwright test --project=${params.TEST_ENV} ${tagArg} ${playwrightArgs}"
                    }
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: '**/junit.xml'
            publishHTML(target: [
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright HTML Report',
                keepAll: true,
                alwaysLinkToLastBuild: false
            ])
            archiveArtifacts artifacts: 'playwright-report/**/*, test-results/**/*', allowEmptyArchive: true
        }

        success {
            mail to: 'janah.intal@ibc.com.au',
                 subject: "✅ ECOM Daily Test Automation - SUCCESS",
                 body: """Hi Janah,

Great news! The ECOM Daily Test Automation suite passed successfully.

--------------------------------------------------
📌 Project: ${env.JOB_NAME}
🌍 Environment: ${params.TEST_ENV}
📊 Status: SUCCESS
🔢 Build: #${env.BUILD_NUMBER}
--------------------------------------------------

You can view the report here:
🔗 ${env.BUILD_URL}Playwright_20HTML_20Report/

Best regards,
Jenkins Automation Bot"""
        }
        
        // 2. Send email only if status is FAILURE or UNSTABLE
        unsuccessful {
            mail to: 'janah.intal@ibc.com.au, will.castley@cengage.com',
                 subject: "⚠️ ECOM Daily Test Automation FAILS",
                 body: """Hi Team,

The ECOM Daily Test Automation suite just finished, and it looks like we have some failures or instability in the current run.

Quick Summary:
--------------------------------------------------
📌 Project: ${env.JOB_NAME}
🌍 Environment: ${params.TEST_ENV}
📊 Status: ${currentBuild.currentResult}
🔢 Build: #${env.BUILD_NUMBER}
--------------------------------------------------

You can check the detailed Playwright results here to see what went wrong:
🔗 ${env.BUILD_URL}Playwright_20HTML_20Report/

Or view the build logs here:
🔗 ${env.BUILD_URL}"""
        }
    }
}
pipeline {
    agent any

    triggers {
        // Runs at 6 AM Sydney time. 
        // Note: Using standard cron is safer if you aren't sure about the Parameterized plugin.
        cron("""TZ=Australia/Sydney
H 6 * * *""")
    }

    tools {
        nodejs 'node20' 
    }

    parameters {
        // PROD is first, so it is the default for the 6 AM run
        choice(name: 'TEST_ENV', choices: ['PROD', 'S2'], description: 'Environment to run')
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
                    // Force PROD if started by timer, otherwise use user choice
                    def isScheduled = currentBuild.getBuildCauses().toString().contains('TimerTrigger')
                    env.RUN_TARGET = isScheduled ? 'PROD' : params.TEST_ENV
                    
                    def tagArg = params.TAGS?.trim() ? "--grep @${params.TAGS.trim()}" : ''
                    def playwrightArgs = "--workers=1 --retries=2"
                    
                    if (isUnix()) {
                        sh "npx playwright test --project=${env.RUN_TARGET} ${tagArg} ${playwrightArgs}"
                    } else {
                        bat "npx playwright test --project=${env.RUN_TARGET} ${tagArg} ${playwrightArgs}"
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
            script {
                // Only email Janah if the run was on PROD
                if (env.RUN_TARGET == 'PROD') {
                    emailext(
                        to: 'janah.intal@ibc.com.au',
                        subject: "✅ ECOM Daily Test Automation - SUCCESS [PROD]",
                        body: """Hi Janah,

Great news! The daily PROD automation run passed successfully.

Project: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Environment: PROD

View Report: ${env.BUILD_URL}Playwright_20HTML_20Report/
"""
                    )
                }
            }
        }
        
        unsuccessful {
            mail to: 'janah.intal@ibc.com.au, will.castley@cengage.com',
                 subject: "⚠️ ECOM Daily Test Automation FAILS [${env.RUN_TARGET}]",
                 body: """Hi Team,

The daily automation run for ${env.RUN_TARGET} failed or is unstable.

--------------------------------------------------
🌍 Environment: ${env.RUN_TARGET}
📊 Status: ${currentBuild.currentResult}
🔢 Build: #${env.BUILD_NUMBER}
--------------------------------------------------

View Report: ${env.BUILD_URL}Playwright_20HTML_20Report/
Build Logs: ${env.BUILD_URL}"""
        }
    }
}
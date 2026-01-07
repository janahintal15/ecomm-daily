pipeline {
    agent any

    triggers {
        cron("""TZ=Australia/Sydney
H 6 * * *""")
    }

    tools {
        nodejs 'node20' 
    }

    parameters {
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
                    def isScheduled = currentBuild.getBuildCauses().toString().contains('TimerTrigger')
                    env.FINAL_ENV = isScheduled ? 'PROD' : params.TEST_ENV
                    
                    def tagArg = params.TAGS?.trim() ? "--grep @${params.TAGS.trim()}" : ''
                    def playwrightArgs = "--workers=2 --retries=2"
                    
                    // ✅ Inject credentials directly into the environment
                    withEnv([
                        "S2_EMAIL=kriztine@ibcdigital.com.au",
                        "S2_PASSWORD=Pastadura1",
                        "PROD_EMAIL=htcb2btestaus@mail.com",
                        "PROD_PASSWORD=123456",
                        "S2_EMAIL_NZ=197914@xyz.com",
                        "S2_PASSWORD_NZ=123456",
                        "PROD_EMAIL_NZ=htcb2btestnz@mail.com",
                        "PROD_PASSWORD_NZ=123456"
                    ]) {
                        if (isUnix()) {
                            sh "npx playwright test --project=${env.FINAL_ENV} ${tagArg} ${playwrightArgs}"
                        } else {
                            bat "npx playwright test --project=${env.FINAL_ENV} ${tagArg} ${playwrightArgs}"
                        }
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
                // Only send Success email if it was a PROD run
                if (env.FINAL_ENV == 'PROD') {
                    emailext(
                        to: 'janah.intal@ibc.com.au',
                        subject: "✅ ECOM Daily Test Automation - SUCCESS [PROD]",
                        body: """Hi Janah,

The scheduled daily automation for PROD passed successfully.

Project: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}

View Report: ${env.BUILD_URL}Playwright_20HTML_20Report/
"""
                    )
                }
            }
        }
        
        unsuccessful {
            // Failure emails are always sent regardless of environment
            mail to: 'janah.intal@ibc.com.au, will.castley@cengage.com',
                 subject: "⚠️ ECOM Daily Test Automation FAILS [${env.FINAL_ENV}]",
                 body: """Hi Team,

The daily automation run for ${env.FINAL_ENV} failed or is unstable.

View Report: ${env.BUILD_URL}Playwright_20HTML_20Report/
Build Logs: ${env.BUILD_URL}"""
        }
    }
}
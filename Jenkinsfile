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
                if (env.FINAL_ENV == 'PROD') {
                    emailext(
                        to: 'janah.intal@ibc.com.au',
                        subject: "PROD Health Check: All Good! (Build #${env.BUILD_NUMBER})",
                        mimeType: 'text/html',
                        body: """
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; max-width: 600px;">
                            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
                                <h1 style="margin: 0; font-size: 24px;">ECOM Daily Automation</h1>
                                <p style="margin: 5px 0 0; font-weight: bold;">STATUS: SUCCESSFUL</p>
                            </div>
                            <div style="padding: 20px; color: #333;">
                                <p>Hi Janah,</p>
                                <p>The daily production health check has finished successfully. All critical paths are operating as expected.</p>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Environment:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">PROD</td></tr>
                                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Build Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">#${env.BUILD_NUMBER}</td></tr>
                                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Project:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${env.JOB_NAME}</td></tr>
                                </table>
                                <div style="text-align: center; margin-top: 30px;">
                                    <a href="${env.BUILD_URL}Playwright_20HTML_20Report/" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Test Report</a>
                                </div>
                            </div>
                            <div style="background-color: #f8f9fa; color: #888; padding: 10px; text-align: center; font-size: 12px;">
                                This is an automated message from the ECOM Jenkins Bot.
                            </div>
                        </div>
                        """
                    )
                }
            }
        }
        
        unsuccessful {
            script {
                emailext(
                    to: 'janah.intal@ibc.com.au',
                    subject: "Oops! Some test have failed - ECOM DAILY TEST [${env.FINAL_ENV}]",
                    mimeType: 'text/html',
                    body: """
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; max-width: 600px;">
                        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px;">ECOM Daily Automation</h1>
                            <p style="margin: 5px 0 0; font-weight: bold;">STATUS: ${currentBuild.currentResult}</p>
                        </div>
                        <div style="padding: 20px; color: #333;">
                            <p>Hi Team,</p>
                            <p>The latest automation run encountered some issues that require investigation.</p>
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Environment:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${env.FINAL_ENV}</td></tr>
                                <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Build Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">#${env.BUILD_NUMBER}</td></tr>
                                <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Failure Details:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #dc3545;">Check Logs</td></tr>
                            </table>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${env.BUILD_URL}Playwright_20HTML_20Report/" style="background-color: #333; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Failures</a>
                            </div>
                        </div>
                        <div style="background-color: #f8f9fa; color: #888; padding: 10px; text-align: center; font-size: 12px;">
                            Sent by the ECOM Jenkins Bot. <a href="${env.BUILD_URL}">Build Details</a>
                        </div>
                    </div>
                    """
                )
            }
        }
    }
}
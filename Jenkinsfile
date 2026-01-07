pipeline {
    agent any

    tools {
        // Ensure this matches the name in your Jenkins Global Tool Configuration
        nodejs 'node20' 
    }

    parameters {
        choice(name: 'TEST_ENV', choices: ['S2', 'PROD'], description: 'Environment to run')
        string(name: 'TAGS', defaultValue: '', description: 'Optional @tag filter')
    }

    stages {
        stage('Checkout') {
            steps {
                // Simplified checkout using the configured SCM (Git)
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
                    // Using returnStatus: true prevents the pipeline from stopping immediately if tests fail,
                    // allowing the 'Post' section to still publish reports.
                    if (isUnix()) {
                        sh "npx playwright test --project=${params.TEST_ENV} ${tagArg}"
                    } else {
                        bat "npx playwright test --project=${params.TEST_ENV} ${tagArg}"
                    }
                }
            }
        }
    }

    post {
        always {

            // 1. Process JUnit results for the trend chart
            junit allowEmptyResults: true, testResults: '**/junit.xml'

            // 2. Publish HTML Report (This creates the link INSIDE the build)
            publishHTML(target: [
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright HTML Report',
                keepAll: true,
                alwaysLinkToLastBuild: false // Set to false to see build-specific reports
            ])
            // Archive files so they can be downloaded from the build page
            archiveArtifacts artifacts: 'playwright-report/**/*, test-results/**/*', allowEmptyArchive: true
        }
    }
}
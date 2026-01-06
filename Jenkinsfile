pipeline {
  agent any

  tools {
    nodejs 'node20'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        bat '''
          node -v
          npm -v
          npm ci
        '''
      }
    }

    stage('Install Playwright Browsers') {
      steps {
        bat '''
          npx playwright install
        '''
      }
    }

    stage('Run Playwright Tests') {
      steps {
        bat '''
          npx playwright test
        '''
      }
    }
  }
}

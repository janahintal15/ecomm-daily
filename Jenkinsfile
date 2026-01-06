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
          echo === NODE & NPM ===
          node -v
          npm -v

          echo === CLEAN INSTALL ===
          rmdir /s /q node_modules 2>nul
          del package-lock.json 2>nul

          npm install
        '''
      }
    }

    stage('Install Playwright Browsers') {
      steps {
        bat '''
          npx playwright install chromium
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

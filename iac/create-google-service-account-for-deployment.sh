PROJECT_ID=paste-1c305

gcloud iam service-accounts create github-actions-deploy \
    --description="Deploy firebase from Github Action" \
    --display-name="Github Actions deployer" \
    --project="${PROJECT_ID}"

gcloud projects add-iam-policy-binding \
    --member="serviceAccount:github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role=roles/editor \
    "${PROJECT_ID}"

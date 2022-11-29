PROJECT_ID=paste-1c305

gcloud iam service-accounts create github-actions-deploy \
    --description="Deploy firebase from Github Action" \
    --display-name="Github Actions deployer" \
    --project="${PROJECT_ID}"

for role in \
    "roles/editor" \
    "roles/cloudfunctions.admin" \
    "roles/secretmanager.admin" \
    ; do

    gcloud projects add-iam-policy-binding \
        --member="serviceAccount:github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com" \
        --role=${role} \
        "${PROJECT_ID}"

done
# Federation of the app

Access to the app can be federated to other domains.

'''mermaid

sequenceDiagram
    participant User
    participant YC as https://your-company.com
    participant AYC as https://app.your-company.com
    participant YCS as Your company Stripe
    autonumber
    User->>YC: Browse to
    YC->>AYC: Follow link to app
    User->>AYC: Add extra display
    AYC-->>AYC: Verify limits
    AYC->>User: "Limits exceeded - review licensing?"
    User->>AYC: "Yes"
    AYC->>User: redirect
    User->>YC: Browse licenses
    User->>YCS: Follow link to purchase
    YCS->>YC:??? 
  
'''

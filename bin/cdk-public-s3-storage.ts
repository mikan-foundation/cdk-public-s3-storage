import { App, Environment, Stack, StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone, IHostedZone } from "aws-cdk-lib/aws-route53";
import { CdkPublicS3StorageStack } from "../lib/cdk-public-s3-storage-stack";
const domainName = "s3.sapporo-engineer-base.dev"

const app = new App()

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT!,
  region: process.env.CDK_DEFAULT_REGION!,
};

const envJP: Environment = {
  account: env.account,
  region: "ap-northeast-1",
}

const envUS: Environment = {
  account: env.account,
  region: "us-east-1",
}

const usStack = new Stack(app, `cdk-public-s3-storage-FrontCdkStack`, {
  env: envUS,
  crossRegionReferences: true,
})

const cert = new Certificate(usStack, `${domainName}-cert`, {
  domainName: domainName,
  validation: CertificateValidation.fromDns(),
})

new CdkPublicS3StorageStack(app, `cdk-public-s3-storage-BackCdkStack`, {
  env: envJP,
  cert: cert,
  crossRegionReferences: true,
})
import { App, Duration, ScopedAws, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate, CertificateValidation, DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { AllowedMethods, CachePolicy, CachedMethods, Distribution, HttpVersion, OriginAccessIdentity, PriceClass, SecurityPolicyProtocol, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CanonicalUserPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface Props extends StackProps {
  cert: Certificate;
}

export class CdkPublicS3StorageStack extends Stack {
  constructor(scope: Construct, id: string, props?: Props) {
    super(scope, id, props);

    const {cert} = props!

    const bucket = new Bucket(this, 'seb-public-bucket', {
      bucketName: 'seb-public-bucket',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    })

    const oai = new OriginAccessIdentity(
      this,
      "OriginAccessIdentity",
    )

    bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        effect: Effect.ALLOW,
        resources: [bucket.bucketArn + "/*"],
        principals: [new CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      })
    )

    new Distribution(this, "Distribution", {
      domainNames: ["s3.sapporo-engineer-base.dev"],     
       defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: CachedMethods.CACHE_GET_HEAD,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        origin: new S3Origin(bucket),
      },
      errorResponses: [
        {
          httpStatus: 403,
          responsePagePath: '/error.html',
          responseHttpStatus: 200,
          ttl: Duration.seconds(300),
        },
        {
          httpStatus: 404,
          responsePagePath: '/error.html',
          responseHttpStatus: 200,
          ttl: Duration.seconds(300),
        },
      ],
      priceClass: PriceClass.PRICE_CLASS_ALL,
      enabled: true,
      certificate: cert,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: HttpVersion.HTTP2,
      enableIpv6: true,
    })
  }
}

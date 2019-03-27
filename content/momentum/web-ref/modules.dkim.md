| [Prev](modules.disclaimer)  | Chapter 14. Modules Reference |  [Next](modules.dnsbuf.php) |

## 14.27. dkim – DomainKeys Identified Mail Signatures

<a class="indexterm" name="idp19178080"></a>

DomainKeys Identified Mail (DKIM), specified in Internet-Draft [draft-ietf-dkim-base-00](http://tools.ietf.org/html/draft-ietf-dkim-base-00), is a mechanism that allows verification of the source and contents of email messages. Using DKIM, sending domains can include a cryptographic signature in outgoing email messages. A message's signature may be verified by any (or all) MTAs during transit and by the Mail User Agent (MUA) upon delivery. A verified signature indicates the message was sent by the sending domain and the message was not altered in transit. A signature that fails verification indicates the message may have been altered during transit or that the sender is fraudulently using the sending domain name. Unsigned messages contain no guarantee about the sending domain or integrity of the message contents.

### Warning

The [opendkim](modules.opendkim "14.49. opendkim – OpenDKIM module") module is available as of Momentum 3.6 and should be used in place of the DKIM modules. However, you must upgrade to version 3.6 first. If Multiple Event Loop Mode is enabled, you must use the opendkim modules for DKIM signing and verification. The DKIM modules are not supported in Multiple Event Loop Mode.

Service providers may use the success or failure of DKIM signature verification, or the lack of a DKIM signature to determine subsequent handling of incoming email messages. Possible actions include dropping invalid messages without impact to the final recipient or exposing the results of DKIM verification, or the lack of a signature, directly to the recipient. Additionally, service providers may use signature verification as the basis for persistent reputation profiles to support anti-spam policy systems or to share with other service providers.

### 14.27.1. How it Works

**14.27.1.1. Sending Servers**<a name="figure_dkim_schematic"></a>

**Figure 14.1. DKIM schematic**

![](images/gr_dkeys_1.gif)

1.  Set up: The domain owner (typically the team running the email systems within a company or service provider) generates a public/private key pair to use for signing all outgoing messages (multiple key pairs are allowed). The public key is published in DNS, and the private key is made available to their DKIM-enabled outbound email servers. This is step "A" in the diagram to the right.

2.  Signing: When each email is sent by an authorized end-user within the domain, the DKIM-enabled email system automatically uses the stored private key to generate a digital signature of the message. This signature is included in a DKIM-Signature header and prepended to the email. The email is then sent on to the recipient's mail server. This is step "B" in the diagram to the right.

**14.27.1.2. Receiving Servers**

1.  Preparation: The DKIM-enabled receiving email system extracts and parses the message's DKIM-Signature header. The signing domain asserted by the header is used to fetch the signer's public key from DNS. This is step "C" in the diagram to the right.

2.  Verification: The signer's public key is then used by the receiving mail system to verify that the signature contained in the DKIM-Signature header was generated by the sending domain's private key. This proves that the email was truly sent by, and with the permission of, the claimed sending domain. It also provides that all the headers signed by the sending domain and the message body were not altered during transit.

3.  Delivery: The receiving email system uses the outcome of signature verification along with other local policies and tests to determine the disposition of the message. If local policy does not prohibit delivery, the message is passed to the user's inbox. Optionally, the email recipient may be informed of the results of the signature verification. This is step "D" in the diagram on the right.

### 14.27.2. Validation

When the `dkim_validate` module is loaded, dkim signature verification is performed on all inbound messages received via SMTP. To load dkim_validate the following directive is included in `ecelerity.conf`.

<a name="example.dkim.3"></a>

**Example 14.45. dkim_validate module**

```
dkim_validate "dkim_validate1" {
}
```

When a message is received, an attempt is made to locate a DKIM-Signature header. If found, the header is parsed for format and content. If the header is valid, the signature value is extracted from the header and the appropriate DNS operations are performed to find the public key for the signer. The message is then canonicalized as indicated by the signature header. Canonicalization includes all headers listed in the signature header, the body of the message, and the signature header itself. The canonicalized message is digested for verification as indicated by the signature header using the retrieved public key and the signature value. The results "dkim=pass" or "dkim=*`reason for failure`*             " are included in an Authentication-Results header prepended to the message. If the message does not contain a DKIM-Signature header, either no Authentication-Results header will be prepended to the message or dkim results will not appear in an Authentication-Results header prepended because of the actions of a different validation action.

### 14.27.3. Signing

The `dkim_sign` module provides the ability to conditionally attach DKIM signatures to emails that are submitted into the MTA via SMTP. Enabling DKIM signing is a two-step process. The first step is to generate public and private keys for each signing domain and to create the DKIM public key DNS records for those domains. The second step is to configure Momentum to load the dkim_sign module.

You can globally enable or disable DKIM signing using the [dkim](conf.ref.dkim "dkim") option. This option defaults to `enabled`, enabling signing for all domains; you can set it to `disabled` globally and enable it only for specific Binding_Groups, Bindings or Domains. Note that you would not normally need to change this, since even when signing is enabled globally you also need to have a valid key and selector configured for a domain. For this reason signing is usually "enabled" by defining selectors and keys for the signing domains in the dkim_sign module.

**14.27.3.1. Generating DKIM Keys**

The OpenSSL cryptography toolkit is used to generate RSA keys for DKIM. As an example, the following openssl commands are used to generate public and private keys for the domain example.com with a selector called `dkim1024`. Typically, the directory `/opt/msys/ecelerity/etc/conf/dkim` is used for key storage.

```
# mkdir -p /opt/msys/ecelerity/etc/conf/dkim/example.com
# openssl genrsa -out /opt/msys/ecelerity/etc/conf/dkim/example.com/dkim1024.key 1024
# openssl rsa -in /opt/msys/ecelerity/etc/conf/dkim/example.com/dkim1024.key \
        -out /opt/msys/ecelerity/etc/conf/dkim/example.com/dkim1024.pub -pubout -outform PEM
```

All DKIM verification implementations must support key sizes of 512, 768, 1024, 1536 and 2048 bits. A signer may choose to sign messages using any of these sizes and may use a different size for different selectors. Larger key sizes provide greater security but impose higher CPU costs during message signing and verification.

### Warning

Note that Google requires all senders to sign with a 1024 bit or greater DKIM key size.

The resulting public key should look something like:

```
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCrZXNwzXOk0mRqPcgSUOnmVHro
rg/BZHybpiBoDS/g6IaMjmVwaQf2E72x9yDBTgiUBtTCqydQRZJ3EbfYfvo+WAHq
2yz6HKR0XCwMDSE2S3brVe7mbV/GPEvnCuFPPEVjbfL4w0tEAd8Seb5h07uVQqy1
Q7jIOnF5fG9AQNd1UQIDAQAB
-----END PUBLIC KEY-----
```

Once the public and private keys have been generated a DNS text record needs to be created for dkim1024._domainkey.example.com. The DNS record contains several DKIM "tag=value" pairs and should be similiar to the record shown below.

```
dkim1024._domainkey.example.com. 86400 IN TXT
"v=DKIM1; k=rsa; h=sha256; t=y; p=MHww...QAB"
```

DKIM DNS text record tags are defined below (do not include the quotes below when including a tag value in the DNS text record):

<dl className="variablelist">

<dt>v=</dt>

<dd>

DKIM key record version. The value of this tag must be set to "DKIM1".

</dd>

<dt>k=</dt>

<dd>

Key type. This tag defines the syntax and semantics of the p= tag value. Currently this tag should have the value "rsa".

</dd>

<dt>h=</dt>

<dd>

Hash algorithm. Currently this tag should have the value "sha1" or "sha256".

</dd>

<dt>t=</dt>

<dd>

Flags. The only value currently defined is "y". If specified this tag indicates the signing domain is testing DKIM.

</dd>

<dt>p=</dt>

<dd>

The DKIM public key value generated as described above.

</dd>

<dt>g=</dt>

<dd>

**Configuration Change. ** In line with RFC 6376, this tag has been deprecated.

Granularity of the key. The intent of this tag is to constrain which signing address can legitimately use the selector for this key. If this tag is specified, the local part of an email's signing address must match the value of this tag or verification will fail. If this tag is not specified only the domain part of the signing address will be used during verification. If an empty value (i.e. "g=") is specified, no signing address will be able to use this key.

</dd>

<dt>s=</dt>

<dd>

Service Type. If specified, this tag should be set to "*" or "email" which represents all service types or the email service type. Currently "email" is the only service using this key.

</dd>

<dt>n=</dt>

<dd>

Notes. If specified, the value of this tag is quoted-printable text used as a note to anyone reading the DNS text record. The tag is not interpreted by DKIM verification and should be used sparingly because of space limitations of the DNS text record.

</dd>

</dl>

**14.27.3.2. Configuring Momentum to sign mail using DKIM**

A Momentum configuration directive similiar to the following is used to load the dkim_sign module. Additionally, DKIM signing may be enabled/disabled on a global, per domain, per binding and per binding-per domain basis using the configuration parameter: [dkim](conf.ref.dkim "dkim")

<a name="example.dkim_sign.3"></a>

**Example 14.46. dkim_sign module**

```
dkim_sign "dkim_sign1"{
  sign_condition = "can_relay"
  digest="rsa-sha256"
  header_canon = "relaxed"
  body_canon = "relaxed"
  headerlist = "From:Subject:Date:To:MIME-Version?:Content-Type?"
  key = "/opt/msys/ecelerity/etc/conf/dkim/%{d}/%{s}.key"
  dk_domain "example.com" {
    selector = "dkim1024"
  }
  dk_domain "example2.com" {
    selector = "s1024"
  }
}
```

If you are working within a cluster environment, you may want to consider setting the `key` option to a directory that is under revision control. The recommended directory is `/opt/msys/ecelerity/etc/conf/dkim/`. Since the `conf` directory is under revision control anything stored below this directory will also be under revision control. Any files in this directory are visible to both the default node configuration and any node-specific configuration.

Use `dkim_validate` to define a module for validating incoming mail.

The above directive includes a series of global configuration options and one or more domain subconfigurations. A unique domain subconfiguration must be specified for each signing domain if selector names differ. Domain subconfigurations have the following format:

<a name="example.dkim.domain.3"></a>

**Example 14.47. domain subconfiguration module**

dk_domain "*`domain`*" { ... }

"dkim_sign" configuration options are described below. Any option can appear as a dkim_sign or dk_domain scope configuration option with the exception of the `base_domain` option which can only appear within the `dk_domain` scope.

<dl className="variablelist">

<dt>base_domain</dt>

<dd>

`base_domain` specifies which domain should be used for the signing. DKIM allows for emails to be signed by a parent domain. For example, a mail from test@corp.example.com can be signed in the example.com domain. This option can only appear within the `dk_domain` scope.

</dd>

<dt>body_canon</dt>

<dd>

Specifies the canonicalization that should be performed on the email body before digesting and signing the message. The two supported canonicalizations are `simple` and `relaxed`. Use of `relaxed` is suggested.

</dd>

<dt>body_length_limit</dt>

<dd>

The `body_length_limit` option causes the number of message body characters signed to be included in the signature header. Only the number of characters indicated in the signature header will be included in verification at a receiving domain. To include body length limits, the value of this option should be set to "True". The DKIM specification cautions signers to be wary of using this option, as it is subject to potential attacks, such as additional MIME parts and additional HTML content. See section 8.1, "Misuse of Body Length Limits" of the draft specification.

</dd>

<dt>copy_headers</dt>

<dd>

This option causes all of the headers that were selected for signing by `headerlist` to be quoted-printable encoded and placed in the z= tag of the DKIM-Signature header. This can be useful for debugging.

</dd>

<dt>digest</dt>

<dd>

Specifies the algorithms that should be used to create the message digest and resulting signature. The supported mechanisms are `rsa-sha1` and `rsa-sha256`.

</dd>

<dt>header_canon</dt>

<dd>

Specifies the canonicalization that should be performed on the email headers before digesting and signing the message. The two supported canonicalizations are `simple` and `relaxed`. Due to the way MTAs operate, the simple canonicalization is very fragile and prone to failure because of header rewriting and rewrapping. Use of `relaxed` is suggested.

</dd>

<dt>headerlist</dt>

<dd>

The headerlist configuration directive is required. During digestion DKIM will sign all headers specified in the headerlist in the order they are specified. Although there is no default headerlist, the DKIM specification requires signing the From header and any header field that describes the role of the signer such Sender or Resent-From. The specification also recommends signing, Subject, Date, all MIME header fields and all existing, non-repeatable header fields.

The headerlist itself is a colon separated list of header field names. The characters "?", "*" and "+" are appended to the header field name to specify signing of multiple copies of a header and to assert a non-existent header.

DKIM provides for a signer to sign a non-existent header. This mechanism can be used to prevent the header from being added to the message during transit. If the header is added during transit the DKIM signature will not verify. Using this mechanism the signer asserts that the header was not there when the message was signed.

The headerlist syntax is described below.

<dl className="variablelist">

<dt>*`header_field_name`*</dt>

<dd>

A single copy of the header will be signed. Assert a non-existent header if the header does not exist. If that header is added later, the signature will be invalidated.

</dd>

<dt>*`header_field_name`*?</dt>

<dd>

A single copy of the header will be signed. Do not assert a non-existent header if the header does not exist.

</dd>

<dt>*`header_field_name`**</dt>

<dd>

Sign all existing copies of the header. Assert a non-existent header if the header does not exist.

</dd>

<dt>*`header_field_name`*+</dt>

<dd>

Sign all existing copies of the header. Do not assert a non-existent header if the header does not exist.

</dd>

</dl>

Example Headerlist (syntactically correct only):

`Received+:X-Example*:From:Subject?:Received`

The headerlist shown above will cause the following signing actions:

1.  All (multiple) Received headers will be signed

2.  All (multiple) X-Example headers will be signed. If no X-Example headers are found a non-existent header is asserted.

3.  A single From header will be signed. A non-existent header is asserted if no From header is found.

4.  A single Subject header will be signed.

5.  A single Received header will be signed. In this case no additional Received headers will be found because of the first "Received+" entry in the headerlist. A non-existent Received header will be asserted prohibiting the addition of any more Received headers during transit.

</dd>

<dt>identity</dt>

<dd>

The `identity` option can be used to specify a user or agent. A standard email address is specified. This value is used in conjunction with the DKIM DNS Key record's g= tag value where the local part of the identity must match the value of the "g=" tag. Note: Use of the `g=` tag has been deprecated.

</dd>

<dt>key</dt>

<dd>

This option is required and specifies the location of the RSA private key file on disk. The key file must be readable by the user that Momentum is running as and must be in Privacy Enhanced Mail (PEM) format.

The file name has two expandable variables that may be used to ease deployment over multiple domains: %{d} expands to the responsible domain and %{s} expands to the selector.

</dd>

<dt>keycache_size</dt>

<dd>

The key cache size expressed as the number of keys. The default value is 2048.

</dd>

<dt>lifetime</dt>

<dd>

The `lifetime` option can be used to specify the length of time a signature remains valid. An expiration value is included in the signature header added to each email message. The lifetime of the signature begins at signing and expires some time later as determined by the `lifetime` option value. A message will not verify after the signature lifetime has expired. The value of this option is specified in hours.

</dd>

<dt>neg_keycache_ttl</dt>

<dd>

In the event that the key isn't already in the cache, the amount of time in seconds before retrieving it again. The default value is 3600.

</dd>

<dt>pos_keycache_ttl</dt>

<dd>

The total time in seconds for items to stay in the cache before fetching them again. The default value is 300.

</dd>

<dt>selector</dt>

<dd>

This option specifies the DKIM selector to be used for signing. During verification the `selector` will be used along with the signing domain to retrieve the signing domain's public key. The key retrieved will be contained in the DNS TXT record for {selector}._domainkey.{domain}.

</dd>

<dt>sign_condition</dt>

<dd>

`sign_condition` specifies which validation context variable must exist as a predicate to signing messages. When an SMTP client performs an SMTP AUTH action, the `auth_user` context key will be set to the username used during authorization. When an SMTP client is allowed to relay through Momentum because of an entry in `Relay_Hosts` or a `relaying` declaration in an ESMTP_Listener IP access control list, the `can_relay` context key is set to "true."

In most corporate environments, sign_condition should be `auth_user` and in large sending architectures where the relaying SMTP clients are implicitly trusted the sign_condition should be `can_relay`.

</dd>

</dl>

### 14.27.4. dkim Management Using Console Commands

The dkim module can be controlled through the `ec_console`; the following command is available:

**14.27.4.1. dkim_sign:*`dkim_sign1`* flush keycache**

This command flushes all entries from the keycache. Use dkim_validate:*`dkim_validate1`* for the validation module. If you alter the private key run this command after doing so.

### 14.27.5. Runtime Usage

**14.27.5.1. Lua Functions**

The following dkim Lua functions are available:

<a name="modules.dkim.lua"></a>

**Table 14.2. Lua functions – dkim**

| Function/Description | Params | Package | Version | Phases |
| --- | --- | --- | --- | --- |
| [msys.validate.dkim.get_domains](lua.ref.msys.validate.dkim.get_domains "msys.validate.dkim.get_domains") – This function requires module "dkim_validate". "msg" is a mail message. "ctx" is the validation context. It returns a list of valid signing domains | msg, ctx | msys.validate.dkim | 3.1 | data, data_spool, data_spool_each_rcpt |
| [msys.validate.dkim.get_responsible_domain](lua.ref.msys.validate.dkim.get_responsible_domain "msys.validate.dkim.get_responsible_domain") – This function requires module "dkim_validate". "msg" is a mail message. "ctx" is the validation context. It returns the responsible domain for the current message | msg, ctx | msys.validate.dkim | 3.1 | data, data_spool, data_spool_each_rcpt |
| [msys.validate.dkim.reflect](lua.ref.msys.validate.dkim.reflect "msys.validate.dkim.reflect") – Should be used before data_validate phase to instruct system to send an email to "receiver_addrs" regarding the validation result of the current message | msg, ctx, sender_addrs, receiver_addrs, [subj], [note] | msys.validate.dkim | 3.1 | before data_validate |
| [msys.validate.dkim.sign](lua.ref.msys.validate.dkim.sign "msys.validate.dkim.sign") – Sign a message using a DKIM signature | msg, vctx, [options] | msys.validate.dkim | 3.1 | core_final_validation |
| [msys.validate.dkim.verify_results_get_count](lua.ref.msys.validate.dkim.verify_results_get_count "msys.validate.dkim.verify_results_get_count") – Return a count of DKIM verification results | results | msys.validate.dkim | 3.5 | data, data_spool, data_spool_each_rcpt |
| [msys.validate.dkim.verify_results_get_item](lua.ref.msys.validate.dkim.verify_results_get_item "msys.validate.dkim.verify_results_get_item") – Return the DKIM signature result at the specified index | results, index_value | msys.validate.dkim | 3.5 | data, data_spool, data_spool_each_rcpt |
| [msys.validate.dkim.verify_status_to_string](lua.ref.msys.validate.dkim.verify_status_to_string "msys.validate.dkim.verify_status_to_string") – Return a status string of DKIM verification | status | msys.validate.dkim | 3.5 | data, data_spool, data_spool_each_rcpt |
| [msys.validate.dkim.get_verify_results](lua.ref.msys.validate.dkim.get_verify_results "msys.validate.dkim.get_verify_results") – Return the number of DKIM signature results | [vctx] | msys.validate.dkim | 3.5 | data, data_spool, data_spool_each_rcpt |

**14.27.5.2. Sieve Functions**

The following dkim Sieve functions are available:

*   [ec_dkim_sign](sieve.ref.ec_dkim_sign "ec_dkim_sign") – Sign a message with the DKIM protocol

*   [ec_dkim_domains](sieve.ref.ec_dkim_domains "ec_dkim_domains") – Return a list of valid signing domains

*   [ec_dkim_responsible_domain](sieve.ref.ec_dkim_responsible_domain "ec_dkim_responsible_domain") – Return the domain responsible for the current message

### 14.27.6. See Also

[signing_stats](conf.ref.signing_stats "signing_stats"), [signing_stats](console_commands.signing_stats.php "signing_stats"), [signing_stats reset](console_commands.signing_stats_reset.php "signing_stats reset"), [dkim](conf.ref.dkim.php "dkim")

| [Prev](modules.disclaimer)  | [Up](modules.php) |  [Next](modules.dnsbuf.php) |
| 14.26. disclaimer – Module  | [Table of Contents](index) |  14.28. dnsbuf – Dynamically Set the DNS UDP Buffer Size |
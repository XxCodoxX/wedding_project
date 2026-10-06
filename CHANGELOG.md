# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.1.1](https://github.com/XxCodoxX/wedding_project/compare/v1.1.0...v1.1.1) (2026-10-06)

### Bug Fixes

* enhance HomePage to handle error codes for password reset links ([12c6de6](https://github.com/XxCodoxX/wedding_project/commit/12c6de657be36c5f3f6abb040e8463c3eab16873))

## [1.1.0](https://github.com/XxCodoxX/wedding_project/compare/v1.0.0...v1.1.0) (2026-10-06)

### Features

* add forgot/reset password flow for admin accounts ([a95c856](https://github.com/XxCodoxX/wedding_project/commit/a95c856eb288baad7575bdf72fd20817a6d48957))

## 1.0.0 (2026-10-05)

### Features

* add @vercel/speed-insights dependency and integrate SpeedInsights component into layout ([713c067](https://github.com/XxCodoxX/wedding_project/commit/713c0677cb966434f3f4ac149434bfb876a859f8))
* add apple-touch-icon and update metadata for open graph and twitter cards ([602bbe7](https://github.com/XxCodoxX/wedding_project/commit/602bbe7bf2a59814e6f40978f1515649fbd2e801))
* Add bride/groom side to guests ([335146b](https://github.com/XxCodoxX/wedding_project/commit/335146b05ed16b5249b644530879ff3400b0ced9))
* add bulk guest import from CSV/Excel ([f2f6c03](https://github.com/XxCodoxX/wedding_project/commit/f2f6c036ef8ba6701723d45fa1c2de2632bc52d8))
* add customizable WhatsApp invitation message template to weddings; update related components for integration ([2e14a51](https://github.com/XxCodoxX/wedding_project/commit/2e14a515da09077d7ee089eafb38a516fba72cc8))
* add page transition animations and optimize invite loading ([3ccaa4f](https://github.com/XxCodoxX/wedding_project/commit/3ccaa4f2149a0960bcb3c4460bbd08896a25f7d6))
* add pagination to the guest table ([e57f7e6](https://github.com/XxCodoxX/wedding_project/commit/e57f7e67c97532f1d68cc18d9d22c3e2dc754ca0))
* add ProjectLogo component and integrate into admin pages; include new SVG icons ([cb82eca](https://github.com/XxCodoxX/wedding_project/commit/cb82ecac8a3c6ec8130ce9a232fb5bfa84d58505))
* add RSVP filtering functionality to guest table ([24ef297](https://github.com/XxCodoxX/wedding_project/commit/24ef2976b45923daf20cfae8dfdadc5b1bb4f57d))
* add search to guest management table ([91df6cd](https://github.com/XxCodoxX/wedding_project/commit/91df6cd05cede2f773b4e5ccc579745b8d324200))
* add sticky filter bar to the guest table ([4481660](https://github.com/XxCodoxX/wedding_project/commit/44816601fcc6f7a061197126620c1e2405798767))
* add support for guest groups and invitation types ([53eca9f](https://github.com/XxCodoxX/wedding_project/commit/53eca9f0caad1c31b82c6a3d4111816b4244cf70))
* add WhatsApp send queue and invitation delivery tracking ([f525444](https://github.com/XxCodoxX/wedding_project/commit/f5254448c03bdea6c94225a81c8ffd720e2b4f6c))
* Allow admins to set RSVP status manually ([77b3c83](https://github.com/XxCodoxX/wedding_project/commit/77b3c83d76906a0eab32974d0c07f3f3f8533278))
* cap admin sessions and expire invite links after the wedding ([448cdbd](https://github.com/XxCodoxX/wedding_project/commit/448cdbd4e26a2d2792fa825be632a233aa71b47c))
* disable prefetching for admin event links and improve authentication checks in proxy ([c983398](https://github.com/XxCodoxX/wedding_project/commit/c983398e978c47cd0979fea87f65fe1c572c8caa))
* Enhance SendQueueButton with side selection and update guest data structure ([63a3843](https://github.com/XxCodoxX/wedding_project/commit/63a384368159e51c48fe9adec1b29fab5147ee51))
* Enhance user management and access control ([b344b40](https://github.com/XxCodoxX/wedding_project/commit/b344b40e5866fa0c944191722ca1fd095d790403))
* enhance wedding invitation templates with custom messages and agenda items ([d815b6c](https://github.com/XxCodoxX/wedding_project/commit/d815b6c1c0c79b18b0feaec1ab6706eeb9b7b565))
* implement guest import functionality with modal and CSV/Excel support ([337ad54](https://github.com/XxCodoxX/wedding_project/commit/337ad54cb58ce0eee7e0367c1ab6aa7cb4d9ba97))
* live updates for guest management table ([c2fb8c6](https://github.com/XxCodoxX/wedding_project/commit/c2fb8c6275b187b1f985293c8de48a8c16d5dadd))

### Bug Fixes

* always exclude duplicate rows from guest import ([c20d5d6](https://github.com/XxCodoxX/wedding_project/commit/c20d5d61474bc36c646e70c27a21a9d4157b956f))
* **auth:** prevent prefetch-triggered logout and handle logout via POST ([e67dbda](https://github.com/XxCodoxX/wedding_project/commit/e67dbda582d46523f097abcc6720671f8d9397ad))
* keep guest table order stable after RSVP updates ([6702090](https://github.com/XxCodoxX/wedding_project/commit/6702090a8b21e2c2eaeabcd5d667a2fd651ae363))
* keep scroll position after updating guests on the dashboard ([49084e7](https://github.com/XxCodoxX/wedding_project/commit/49084e71a26b3f7b82106d66cb05794e128fd67c))
* remove last commit changes ([4f7c2de](https://github.com/XxCodoxX/wedding_project/commit/4f7c2de442d7286d01dd473a7249e1d98c018962))
* show full guest names in group RSVP on narrow cards ([a09b59b](https://github.com/XxCodoxX/wedding_project/commit/a09b59b5a581c536f95c695af5d621765f889d9c))
* update wedding celebration text and improve couple names styling in invitation screen ([424bf20](https://github.com/XxCodoxX/wedding_project/commit/424bf20b6eed62051041bc06e05741e568bdc11b))
* update wedding invitation title format and enhance description text ([6714522](https://github.com/XxCodoxX/wedding_project/commit/6714522ab314239b190e4117a076e061d27796ac))
* upgrade Next.js to 16.3.6 to patch critical RCE vulnerability ([a792014](https://github.com/XxCodoxX/wedding_project/commit/a792014fcb250f5817745a20fa2cabf6560517e3))

### Performance

* filter guest table client-side for instant tab switching ([cb3707b](https://github.com/XxCodoxX/wedding_project/commit/cb3707b133e9519b39b96d36cfb2a76d977b4e60))

### Styling

* improve styling and layout for RSVP forms ([8cf7f95](https://github.com/XxCodoxX/wedding_project/commit/8cf7f95332c31c6fcea471148ec9b07ec79b5127))

--
-- Table structure for table `data_layanan`
--

DROP TABLE IF EXISTS `data_layanan`;
CREATE TABLE `data_layanan` (
  `service_no` varchar(50) NOT NULL,
  `alamat` text NOT NULL,
  PRIMARY KEY (`service_no`)
);

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `incident` varchar(255) NOT NULL,
  `ticket_id_gamas` varchar(255) DEFAULT NULL,
  `external_ticket_id` varchar(255) DEFAULT NULL,
  `customer_id` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `service_id` varchar(255) DEFAULT NULL,
  `service_no` varchar(255) DEFAULT NULL,
  `summary` text,
  `description_assignment` text,
  `reported_date` datetime DEFAULT NULL,
  `reported_by` varchar(255) DEFAULT NULL,
  `reported_priority` varchar(255) DEFAULT NULL,
  `source_ticket` varchar(255) DEFAULT NULL,
  `channel` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `status_date` datetime DEFAULT NULL,
  `booking_date` datetime DEFAULT NULL,
  `resolve_date` datetime DEFAULT NULL,
  `date_modified` datetime DEFAULT NULL,
  `last_update_worklog` text,
  `closed_by` varchar(255) DEFAULT NULL,
  `closed_reopen_by` varchar(255) DEFAULT NULL,
  `guarantee_status` varchar(255) DEFAULT NULL,
  `ttr_customer` varchar(255) DEFAULT NULL,
  `ttr_agent` varchar(255) DEFAULT NULL,
  `ttr_mitra` varchar(255) DEFAULT NULL,
  `ttr_nasional` varchar(255) DEFAULT NULL,
  `ttr_pending` varchar(255) DEFAULT NULL,
  `ttr_region` varchar(255) DEFAULT NULL,
  `ttr_witel` varchar(255) DEFAULT NULL,
  `ttr_end_to_end` varchar(255) DEFAULT NULL,
  `owner_group` varchar(255) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `witel` varchar(255) DEFAULT NULL,
  `workzone` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `subsidiary` varchar(255) DEFAULT NULL,
  `territory_near_end` varchar(255) DEFAULT NULL,
  `territory_far_end` varchar(255) DEFAULT NULL,
  `customer_segment` varchar(255) DEFAULT NULL,
  `customer_type` varchar(255) DEFAULT NULL,
  `customer_category` varchar(255) DEFAULT NULL,
  `service_type` varchar(255) DEFAULT NULL,
  `slg` varchar(255) DEFAULT NULL,
  `technology` varchar(255) DEFAULT NULL,
  `lapul` varchar(255) DEFAULT NULL,
  `gaul` varchar(255) DEFAULT NULL,
  `onu_rx` varchar(255) DEFAULT NULL,
  `pending_reason` text,
  `incident_domain` varchar(255) DEFAULT NULL,
  `symptom` text,
  `hierarchy_path` text,
  `solution` text,
  `description_actual_solution` text,
  `kode_produk` varchar(255) DEFAULT NULL,
  `perangkat` varchar(255) DEFAULT NULL,
  `technician` varchar(255) DEFAULT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `sn_ont` varchar(255) DEFAULT NULL,
  `tipe_ont` varchar(255) DEFAULT NULL,
  `manufacture_ont` varchar(255) DEFAULT NULL,
  `impacted_site` varchar(255) DEFAULT NULL,
  `cause` text,
  `resolution` text,
  `worklog_summary` text,
  `classification_flag` varchar(255) DEFAULT NULL,
  `realm` varchar(255) DEFAULT NULL,
  `related_to_gamas` varchar(255) DEFAULT NULL,
  `tsc_result` varchar(255) DEFAULT NULL,
  `scc_result` varchar(255) DEFAULT NULL,
  `note` text,
  `notes_eskalasi` text,
  `rk_information` text,
  `external_ticket_tier_3` varchar(255) DEFAULT NULL,
  `classification_path` text,
  `urgency` varchar(255) DEFAULT NULL,
  `alamat` text,
  `korlap` varchar(255) DEFAULT NULL,
  `sektor` varchar(50) NOT NULL,
  PRIMARY KEY (`incident`)
);

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` VALUES ('INC-TEST-DARI-EXCEL-001',NULL,NULL,NULL,NULL,NULL,'152703233086','Testing input data baru ke MySQL.',NULL,'2025-07-31 16:00:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'BACKEND',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MALANG',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Perumahan Joyogrand Inside, No. C34 DESA MERJOSARI MALANG  CP = wa.me/6282232324561',NULL,'MLG 2'),('INC-TEST-DARI-EXCEL-003',NULL,NULL,NULL,NULL,NULL,'152710202841','Testing input Part 3.',NULL,'2025-08-08 13:00:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MALANG','BLB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'A YANI 6 DESA SUKOLILO JABUNG MALANG  CP = wa.me/6282142614405','@Endrasakti','MLG 1'),('INC38580092','','','','','1-MOUEVP2','152701238328','WAJIB DIISI MSISDN CONTACT PELANGGAN 085852387143',NULL,'2025-08-10 02:42:15','23255804','','CUSTOMER','1-NOL1KRM','6285852387143','IKA','','BACKEND','2025-08-10 02:42:20',NULL,NULL,NULL,NULL,'REGULER',NULL,NULL,'01:56:01','N/A | N/A','','00:00:00','00:00:00','01:56:01','00:00:00','01:56:01','TIF HD DISTRICT MALANG','','MALANG',NULL,'2025-08-12 19:38:21','',NULL,NULL,'PL-TSEL','21','ODC-BTU-FX ODC-BTU-FX','INTERNET','1-MOUEVP2_152707234425_INTERNET','152707234425','','Fiber','0','0','','','REG-5','INTERNET | TECHNICAL | Tidak Bisa Browsing - 2P / 3P Mati Total','','','','','','NOT GUARANTEE','','ZTEGD826190E','ZTEG-F672Y','','','16830458','','','TECHNICAL','telkom.net','NO','01:56:01','','','','INC000015453134','','JL ZAENAL ZAKSE GG 1C NO 24 RT 010 RW 001 MALANG (SEBELAH WARUNG SATE RAWON PAK ATENG) CP = wa.me/6287740243620',NULL,'MLG 3'),('INC38587292','','','','','1-MOUEVP2','152702316059','WAJIB DIISI MSISDN CONTACT PELANGGAN 085852387143',NULL,'2024-08-11 06:42:15','23255804','','CUSTOMER','1-NOL1KRM','6285852387143','IKA','','BACKEND','2025-08-11 06:42:20',NULL,NULL,NULL,NULL,'REGULER',NULL,NULL,'01:56:01','N/A | N/A','','00:00:00','00:00:00','01:56:01','00:00:00','01:56:01','TIF HD DISTRICT MALANG','','MALANG',NULL,'2025-08-12 19:38:21','',NULL,NULL,'PL-TSEL','21','ODC-BTU-FX ODC-BTU-FX','INTERNET','1-MOUEVP2_152707234425_INTERNET','152707234425','','Fiber','0','0','','','REG-5','INTERNET | TECHNICAL | Tidak Bisa Browsing - 2P / 3P Mati Total','','','','','','NOT GUARANTEE','','ZTEGD826190E','ZTEG-F672Y','','','16830458','','','TECHNICAL','telkom.net','NO','01:56:01','','','','INC000015453134','','Perumh RIVER PLACE RP2-10 DESA KEPUH HARJO KPO MALANG  CP = wa.me/6282335392899',NULL,'MLG 2');

--
-- Table structure for table `work_orders`
--

DROP TABLE IF EXISTS `work_orders`;
CREATE TABLE `work_orders` (
  `incident` varchar(255) NOT NULL,
  `ticket_id_gamas` varchar(255) DEFAULT NULL,
  `external_ticket_id` varchar(255) DEFAULT NULL,
  `customer_id` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `service_id` varchar(255) DEFAULT NULL,
  `service_no` varchar(255) DEFAULT NULL,
  `summary` text,
  `description_assignment` text,
  `reported_date` datetime DEFAULT NULL,
  `reported_by` varchar(255) DEFAULT NULL,
  `reported_priority` varchar(255) DEFAULT NULL,
  `source_ticket` varchar(255) DEFAULT NULL,
  `channel` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(100) DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL,
  `status_date` datetime DEFAULT NULL,
  `booking_date` datetime DEFAULT NULL,
  `resolve_date` datetime DEFAULT NULL,
  `date_modified` datetime DEFAULT NULL,
  `last_update_worklog` datetime DEFAULT NULL,
  `closed_by` varchar(255) DEFAULT NULL,
  `closed_reopen_by` varchar(255) DEFAULT NULL,
  `guarantee_status` varchar(100) DEFAULT NULL,
  `ttr_customer` varchar(50) DEFAULT NULL,
  `ttr_agent` varchar(50) DEFAULT NULL,
  `ttr_mitra` varchar(50) DEFAULT NULL,
  `ttr_nasional` varchar(50) DEFAULT NULL,
  `ttr_pending` varchar(50) DEFAULT NULL,
  `ttr_region` varchar(50) DEFAULT NULL,
  `ttr_witel` varchar(50) DEFAULT NULL,
  `ttr_end_to_end` varchar(50) DEFAULT NULL,
  `owner_group` varchar(255) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `witel` varchar(255) DEFAULT NULL,
  `workzone` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `subsidiary` varchar(255) DEFAULT NULL,
  `territory_near_end` varchar(255) DEFAULT NULL,
  `territory_far_end` varchar(255) DEFAULT NULL,
  `customer_segment` varchar(255) DEFAULT NULL,
  `customer_type` varchar(255) DEFAULT NULL,
  `customer_category` varchar(255) DEFAULT NULL,
  `service_type` varchar(255) DEFAULT NULL,
  `slg` varchar(100) DEFAULT NULL,
  `technology` varchar(100) DEFAULT NULL,
  `lapul` varchar(100) DEFAULT NULL,
  `gaul` varchar(100) DEFAULT NULL,
  `onu_rx` varchar(50) DEFAULT NULL,
  `pending_reason` text,
  `incident_domain` varchar(255) DEFAULT NULL,
  `symptom` text,
  `hierarchy_path` text,
  `solution` text,
  `description_actual_solution` text,
  `kode_produk` varchar(255) DEFAULT NULL,
  `perangkat` varchar(255) DEFAULT NULL,
  `technician` varchar(255) DEFAULT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `sn_ont` varchar(255) DEFAULT NULL,
  `tipe_ont` varchar(255) DEFAULT NULL,
  `manufacture_ont` varchar(255) DEFAULT NULL,
  `impacted_site` text,
  `cause` text,
  `resolution` text,
  `worklog_summary` text,
  `classification_flag` varchar(50) DEFAULT NULL,
  `realm` varchar(255) DEFAULT NULL,
  `related_to_gamas` varchar(255) DEFAULT NULL,
  `tsc_result` text,
  `scc_result` text,
  `note` text,
  `notes_eskalasi` text,
  `rk_information` text,
  `external_ticket_tier_3` varchar(255) DEFAULT NULL,
  `classification_path` text,
  `urgency` varchar(50) DEFAULT NULL,
  `alamat` text,
  `korlap` varchar(255) DEFAULT NULL,
  `sektor` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`incident`)
);

--
-- Table structure for table `workzone_details`
--

DROP TABLE IF EXISTS `workzone_details`;
CREATE TABLE `workzone_details` (
  `id` int NOT NULL,
  `workzone` varchar(10) NOT NULL,
  `korlap_username` varchar(255) NOT NULL,
  `sektor` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
);

--
-- Dumping data for table `workzone_details`
--

INSERT INTO `workzone_details` VALUES
(1, 'BLB', '@nicosuryanata, @hndika, @triyuni75, @Endrasakti', 'MLG 1'),
(2, 'KLJ', '@rolimartin, @JackSpaarroww, @firdausmulia, @YantiMohadi', 'MLG 1'),
(3, 'SGS', '@iqbal_albana, @merin97, @RizkyAHermawan, @Choliz87, @agungspoetra', 'MLG 2'),
(4, 'PKS', '@iqbal_albana, @merin97, @RizkyAHermawan, @Choliz87, @agungspoetra', 'MLG 2'),
(5, 'LWG', '@iqbal_albana, @merin97, @RizkyAHermawan, @Choliz87, @agungspoetra', 'MLG 2'),
(6, 'TMP', '@iqbal_albana, @merin97, @RizkyAHermawan, @Choliz87, @agungspoetra', 'MLG 2'),
(7, 'SWJ', '@iqbal_albana, @merin97, @RizkyAHermawan, @Choliz87, @agungspoetra', 'MLG 2'),
(8, 'BRG', '@iqbal_albana, @merin97, @RizkyAHermawan, @Choliz87, @agungspoetra', 'MLG 2'),
(9, 'MLG', '@huliaihzlq, @Rizkymaulana_06, @Kikuch, @anovitass', 'MLG 3'),
(10, 'GDG', '@azislutfi, @anindya_putra, @alibassss, @bimalaksana90', 'MLG 3'),
(11, 'TUR', '@mochammadmulya, @Penjozasmara, @ipunklutfy, @Gotam27', 'MLG 3'),
(12, 'GDI', '@mochammadmulya, @Penjozasmara, @ipunklutfy, @Gotam27', 'MLG 3'),
(13, 'BNR', '@mochammadmulya, @Penjozasmara, @ipunklutfy, @Gotam27', 'MLG 3'),
(14, 'DPT', '@mochammadmulya, @Penjozasmara, @ipunklutfy, @Gotam27', 'MLG 3'),
(15, 'SBM', '@mochammadmulya, @Penjozasmara, @ipunklutfy, @Gotam27', 'MLG 3'),
(16, 'APG', '@mochammadmulya, @Penjozasmara, @ipunklutfy, @Gotam27', 'MLG 3'),
(17, 'KEP', '@azislutfi, @anindya_putra, @alibassss, @bimalaksana90', 'MLG 3'),
(18, 'SBP', '@azislutfi, @anindya_putra, @alibassss, @bimalaksana90', 'MLG 3'),
(19, 'GKW', '@azislutfi, @anindya_putra, @alibassss, @bimalaksana90', 'MLG 3'),
(20, 'DNO', '@azislutfi, @anindya_putra, @alibassss, @bimalaksana90', 'MLG 3'),
(21, 'PGK', '@azislutfi, @anindya_putra, @alibassss, @bimalaksana90', 'MLG 3'),
(22, 'BTU', '@arishere, @Flyco, @aanksueb, @diditdwif, @athunk05', 'MLG 4'),
(23, 'NTG', '@arishere, @Flyco, @aanksueb, @diditdwif, @athunk05', 'MLG 4'),
(24, 'KPO', '@arishere, @Flyco, @aanksueb, @diditdwif, @athunk05', 'MLG 4');
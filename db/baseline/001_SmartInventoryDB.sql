/*
    SMART INVENTORY DB
    SQL Server - database cho hệ thống Quản lý kho và đề xuất nhập hàng thông minh
*/

IF DB_ID(N'SmartInventoryDB') IS NULL
BEGIN
    CREATE DATABASE SmartInventoryDB;
END;
GO

USE SmartInventoryDB;
GO

/* =========================================================
   1. TÀI KHOẢN VÀ DANH MỤC
   ========================================================= */

CREATE TABLE Accounts
(
    Id              INT IDENTITY(1,1) NOT NULL,
    Username        NVARCHAR(50) NOT NULL,
    PasswordHash    NVARCHAR(255) NOT NULL,
    FullName        NVARCHAR(150) NOT NULL,
    Email           VARCHAR(254) NOT NULL,
    PhoneNumber     VARCHAR(20) NULL,
    DateOfBirth     DATE NULL,
    Address         NVARCHAR(255) NULL,
    Role            VARCHAR(20) NOT NULL,
    Status          VARCHAR(20) NOT NULL CONSTRAINT DF_Accounts_Status DEFAULT ('Active'),
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Accounts_CreatedAt DEFAULT (SYSDATETIME()),
    UpdatedAt       DATETIME2(0) NULL,
    RowVersion      ROWVERSION NOT NULL,

    CONSTRAINT PK_Accounts PRIMARY KEY (Id),
    CONSTRAINT UQ_Accounts_Username UNIQUE (Username),
    CONSTRAINT UQ_Accounts_Email UNIQUE (Email),
    CONSTRAINT CK_Accounts_Role CHECK (Role IN ('NhanVienKho', 'QuanLyKho', 'GiamDoc', 'QTV')),
    CONSTRAINT CK_Accounts_Status CHECK (Status IN ('Active', 'Inactive', 'Locked'))
);
GO

CREATE TABLE Categories
(
    Id              INT IDENTITY(1,1) NOT NULL,
    CategoryName    NVARCHAR(100) NOT NULL,
    ServiceLevel    DECIMAL(5,4) NOT NULL CONSTRAINT DF_Categories_ServiceLevel DEFAULT (0.9500),

    CONSTRAINT PK_Categories PRIMARY KEY (Id),
    CONSTRAINT UQ_Categories_CategoryName UNIQUE (CategoryName),
    CONSTRAINT CK_Categories_ServiceLevel CHECK (ServiceLevel > 0 AND ServiceLevel < 1)
);
GO

CREATE TABLE Suppliers
(
    Id                  INT IDENTITY(1,1) NOT NULL,
    SupplierCode        VARCHAR(20) NOT NULL,
    SupplierName        NVARCHAR(200) NOT NULL,
    ContactPerson       NVARCHAR(150) NULL,
    Email               VARCHAR(254) NULL,
    PhoneNumber         VARCHAR(20) NULL,
    Address             NVARCHAR(255) NULL,
    ExpectedLeadTime    INT NULL,
    IsActive            BIT NOT NULL CONSTRAINT DF_Suppliers_IsActive DEFAULT (1),

    CONSTRAINT PK_Suppliers PRIMARY KEY (Id),
    CONSTRAINT UQ_Suppliers_Code UNIQUE (SupplierCode),
    CONSTRAINT CK_Suppliers_LeadTime CHECK (ExpectedLeadTime IS NULL OR ExpectedLeadTime >= 0)
);
GO

CREATE TABLE Products
(
    Id              INT IDENTITY(1,1) NOT NULL,
    ProductCode     VARCHAR(20) NOT NULL,
    ProductName     NVARCHAR(200) NOT NULL,
    CategoryId      INT NOT NULL,
    DefaultSupplierId INT NULL,
    Unit            NVARCHAR(20) NOT NULL,
    StandardCost    DECIMAL(18,2) NOT NULL CONSTRAINT DF_Products_StandardCost DEFAULT (0),
    ManageByBatch   BIT NOT NULL CONSTRAINT DF_Products_ManageByBatch DEFAULT (0),
    Barcode         VARCHAR(50) NULL,
    IsActive        BIT NOT NULL CONSTRAINT DF_Products_IsActive DEFAULT (1),
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_Products PRIMARY KEY (Id),
    CONSTRAINT UQ_Products_Code UNIQUE (ProductCode),
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
    CONSTRAINT FK_Products_DefaultSupplier FOREIGN KEY (DefaultSupplierId) REFERENCES Suppliers(Id),
    CONSTRAINT CK_Products_StandardCost CHECK (StandardCost >= 0)
);
GO

CREATE UNIQUE INDEX UX_Products_Barcode_NotNull
ON Products(Barcode)
WHERE Barcode IS NOT NULL;
GO

CREATE TABLE Warehouses
(
    Id              INT IDENTITY(1,1) NOT NULL,
    WarehouseCode   VARCHAR(20) NOT NULL,
    WarehouseName   NVARCHAR(100) NOT NULL,
    Address         NVARCHAR(255) NULL,
    IsActive        BIT NOT NULL CONSTRAINT DF_Warehouses_IsActive DEFAULT (1),

    CONSTRAINT PK_Warehouses PRIMARY KEY (Id),
    CONSTRAINT UQ_Warehouses_Code UNIQUE (WarehouseCode)
);
GO

CREATE TABLE Zones
(
    Id              INT IDENTITY(1,1) NOT NULL,
    WarehouseId     INT NOT NULL,
    ZoneCode        VARCHAR(20) NOT NULL,
    ZoneName        NVARCHAR(100) NOT NULL,

    CONSTRAINT PK_Zones PRIMARY KEY (Id),
    CONSTRAINT FK_Zones_Warehouses FOREIGN KEY (WarehouseId) REFERENCES Warehouses(Id),
    CONSTRAINT UQ_Zones_Warehouse_ZoneCode UNIQUE (WarehouseId, ZoneCode)
);
GO

CREATE TABLE Locations
(
    Id              INT IDENTITY(1,1) NOT NULL,
    ZoneId          INT NOT NULL,
    LocationCode    VARCHAR(50) NOT NULL,
    Description     NVARCHAR(255) NULL,

    CONSTRAINT PK_Locations PRIMARY KEY (Id),
    CONSTRAINT FK_Locations_Zones FOREIGN KEY (ZoneId) REFERENCES Zones(Id),
    CONSTRAINT UQ_Locations_Zone_Code UNIQUE (ZoneId, LocationCode)
);
GO

/* =========================================================
   2. LÔ HÀNG VÀ TỒN KHO
   ========================================================= */

CREATE TABLE Batches
(
    Id              BIGINT IDENTITY(1,1) NOT NULL,
    ProductId       INT NOT NULL,
    BatchNumber     VARCHAR(50) NOT NULL,
    MfgDate         DATE NULL,
    ExpDate         DATE NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Batches_CreatedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_Batches PRIMARY KEY (Id),
    CONSTRAINT FK_Batches_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT UQ_Batches_Product_BatchNumber UNIQUE (ProductId, BatchNumber),
    CONSTRAINT CK_Batches_Dates CHECK (MfgDate IS NULL OR ExpDate IS NULL OR ExpDate >= MfgDate)
);
GO

CREATE TABLE InventoryBalances
(
    Id                  BIGINT IDENTITY(1,1) NOT NULL,
    ProductId           INT NOT NULL,
    LocationId          INT NOT NULL,
    BatchId             BIGINT NULL,
    QuantityOnHand      INT NOT NULL CONSTRAINT DF_InventoryBalances_OnHand DEFAULT (0),
    QuantityReserved    INT NOT NULL CONSTRAINT DF_InventoryBalances_Reserved DEFAULT (0),
    UpdatedAt           DATETIME2(0) NOT NULL CONSTRAINT DF_InventoryBalances_UpdatedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_InventoryBalances PRIMARY KEY (Id),
    CONSTRAINT FK_InventoryBalances_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT FK_InventoryBalances_Locations FOREIGN KEY (LocationId) REFERENCES Locations(Id),
    CONSTRAINT FK_InventoryBalances_Batches FOREIGN KEY (BatchId) REFERENCES Batches(Id),
    CONSTRAINT UQ_InventoryBalances_Product_Location_Batch UNIQUE (ProductId, LocationId, BatchId),
    CONSTRAINT CK_InventoryBalances_Quantities
        CHECK (QuantityOnHand >= 0 AND QuantityReserved >= 0 AND QuantityReserved <= QuantityOnHand)
);
GO

/* =========================================================
   3. PHIẾU KHO VÀ SỔ BIẾN ĐỘNG
   ========================================================= */

CREATE TABLE InventoryTickets
(
    Id              INT IDENTITY(1,1) NOT NULL,
    TicketCode      VARCHAR(50) NOT NULL,
    TicketType      VARCHAR(20) NOT NULL,
    Status          VARCHAR(20) NOT NULL CONSTRAINT DF_InventoryTickets_Status DEFAULT ('Draft'),
    Note            NVARCHAR(500) NULL,
    CreatedBy       INT NOT NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_InventoryTickets_CreatedAt DEFAULT (SYSDATETIME()),
    ApprovedBy      INT NULL,
    ApprovedAt      DATETIME2(0) NULL,
    ExecutedAt      DATETIME2(0) NULL,

    CONSTRAINT PK_InventoryTickets PRIMARY KEY (Id),
    CONSTRAINT UQ_InventoryTickets_Code UNIQUE (TicketCode),
    CONSTRAINT FK_InventoryTickets_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Accounts(Id),
    CONSTRAINT FK_InventoryTickets_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES Accounts(Id),
    CONSTRAINT CK_InventoryTickets_Type CHECK (TicketType IN ('Receipt', 'Issue', 'Transfer', 'Adjustment')),
    CONSTRAINT CK_InventoryTickets_Status CHECK (Status IN ('Draft', 'Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled')),
    CONSTRAINT CK_InventoryTickets_Approval CHECK
        ((ApprovedBy IS NULL AND ApprovedAt IS NULL) OR (ApprovedBy IS NOT NULL AND ApprovedAt IS NOT NULL))
);
GO

CREATE TABLE InventoryTicketDetails
(
    Id              BIGINT IDENTITY(1,1) NOT NULL,
    TicketId        INT NOT NULL,
    LineNumber      INT NOT NULL,
    ProductId       INT NOT NULL,
    BatchId         BIGINT NULL,
    SourceLocationId INT NULL,
    DestinationLocationId INT NULL,
    Quantity        INT NOT NULL,
    UnitCost        DECIMAL(18,2) NULL,
    Note            NVARCHAR(255) NULL,

    CONSTRAINT PK_InventoryTicketDetails PRIMARY KEY (Id),
    CONSTRAINT FK_InventoryTicketDetails_Tickets FOREIGN KEY (TicketId) REFERENCES InventoryTickets(Id),
    CONSTRAINT FK_InventoryTicketDetails_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT FK_InventoryTicketDetails_Batches FOREIGN KEY (BatchId) REFERENCES Batches(Id),
    CONSTRAINT FK_InventoryTicketDetails_SourceLocation FOREIGN KEY (SourceLocationId) REFERENCES Locations(Id),
    CONSTRAINT FK_InventoryTicketDetails_DestinationLocation FOREIGN KEY (DestinationLocationId) REFERENCES Locations(Id),
    CONSTRAINT UQ_InventoryTicketDetails_Ticket_Line UNIQUE (TicketId, LineNumber),
    CONSTRAINT CK_InventoryTicketDetails_LineNumber CHECK (LineNumber > 0),
    CONSTRAINT CK_InventoryTicketDetails_Quantity CHECK (Quantity > 0),
    CONSTRAINT CK_InventoryTicketDetails_UnitCost CHECK (UnitCost IS NULL OR UnitCost >= 0),
    CONSTRAINT CK_InventoryTicketDetails_Locations CHECK
    (
        (SourceLocationId IS NULL OR DestinationLocationId IS NULL
         OR SourceLocationId <> DestinationLocationId)
    )
);
GO

CREATE TABLE InventoryTransactions
(
    Id              BIGINT IDENTITY(1,1) NOT NULL,
    TicketDetailId  BIGINT NOT NULL,
    ProductId       INT NOT NULL,
    LocationId      INT NOT NULL,
    BatchId         BIGINT NULL,
    QuantityChange  INT NOT NULL,
    BalanceAfter    INT NOT NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_InventoryTransactions_CreatedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_InventoryTransactions PRIMARY KEY (Id),
    CONSTRAINT FK_InventoryTransactions_TicketDetail FOREIGN KEY (TicketDetailId) REFERENCES InventoryTicketDetails(Id),
    CONSTRAINT FK_InventoryTransactions_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT FK_InventoryTransactions_Locations FOREIGN KEY (LocationId) REFERENCES Locations(Id),
    CONSTRAINT FK_InventoryTransactions_Batches FOREIGN KEY (BatchId) REFERENCES Batches(Id),
    CONSTRAINT CK_InventoryTransactions_QuantityChange CHECK (QuantityChange <> 0),
    CONSTRAINT CK_InventoryTransactions_BalanceAfter CHECK (BalanceAfter >= 0)
);
GO

/* =========================================================
   4. MUA HÀNG VÀ NHẬN HÀNG
   ========================================================= */

CREATE TABLE PurchaseOrders
(
    Id                  INT IDENTITY(1,1) NOT NULL,
    POCode              VARCHAR(20) NOT NULL,
    SupplierId          INT NOT NULL,
    Status              VARCHAR(20) NOT NULL CONSTRAINT DF_PurchaseOrders_Status DEFAULT ('Draft'),
    CreatedBy           INT NOT NULL,
    ApprovedBy          INT NULL,
    OrderDate           DATETIME2(0) NOT NULL CONSTRAINT DF_PurchaseOrders_OrderDate DEFAULT (SYSDATETIME()),
    ExpectedDeliveryDate DATE NULL,
    ClosedAt            DATETIME2(0) NULL,
    Note                NVARCHAR(500) NULL,

    CONSTRAINT PK_PurchaseOrders PRIMARY KEY (Id),
    CONSTRAINT UQ_PurchaseOrders_POCode UNIQUE (POCode),
    CONSTRAINT FK_PurchaseOrders_Suppliers FOREIGN KEY (SupplierId) REFERENCES Suppliers(Id),
    CONSTRAINT FK_PurchaseOrders_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Accounts(Id),
    CONSTRAINT FK_PurchaseOrders_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES Accounts(Id),
    CONSTRAINT CK_PurchaseOrders_Status CHECK (Status IN ('Draft', 'Pending', 'Approved', 'Delivering', 'Partial', 'Completed', 'Cancelled')),
    CONSTRAINT CK_PurchaseOrders_Dates CHECK (ExpectedDeliveryDate IS NULL OR ExpectedDeliveryDate >= CONVERT(date, OrderDate)),
    CONSTRAINT CK_PurchaseOrders_Approval CHECK
        ((ApprovedBy IS NULL) OR (ApprovedBy IS NOT NULL AND Status <> 'Draft'))
);
GO

CREATE TABLE PurchaseOrderDetails
(
    Id                  BIGINT IDENTITY(1,1) NOT NULL,
    POId                INT NOT NULL,
    LineNumber          INT NOT NULL,
    ProductId           INT NOT NULL,
    QuantityOrdered     INT NOT NULL,
    QuantityReceived    INT NOT NULL CONSTRAINT DF_PurchaseOrderDetails_QuantityReceived DEFAULT (0),
    UnitPrice           DECIMAL(18,2) NOT NULL,
    Note                NVARCHAR(255) NULL,

    CONSTRAINT PK_PurchaseOrderDetails PRIMARY KEY (Id),
    CONSTRAINT FK_PurchaseOrderDetails_PO FOREIGN KEY (POId) REFERENCES PurchaseOrders(Id),
    CONSTRAINT FK_PurchaseOrderDetails_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT UQ_PurchaseOrderDetails_PO_Line UNIQUE (POId, LineNumber),
    CONSTRAINT UQ_PurchaseOrderDetails_Id_PO UNIQUE (Id, POId),
    CONSTRAINT CK_PurchaseOrderDetails_LineNumber CHECK (LineNumber > 0),
    CONSTRAINT CK_PurchaseOrderDetails_Quantity CHECK (QuantityOrdered > 0),
    CONSTRAINT CK_PurchaseOrderDetails_QuantityReceived CHECK (QuantityReceived >= 0 AND QuantityReceived <= QuantityOrdered),
    CONSTRAINT CK_PurchaseOrderDetails_UnitPrice CHECK (UnitPrice >= 0)
);
GO

CREATE TABLE GoodsReceipts
(
    Id              INT IDENTITY(1,1) NOT NULL,
    ReceiptCode     VARCHAR(30) NOT NULL,
    POId            INT NOT NULL,
    TicketId        INT NOT NULL,
    ReceivedBy      INT NOT NULL,
    ReceivedAt      DATETIME2(0) NOT NULL CONSTRAINT DF_GoodsReceipts_ReceivedAt DEFAULT (SYSDATETIME()),
    Note            NVARCHAR(500) NULL,

    CONSTRAINT PK_GoodsReceipts PRIMARY KEY (Id),
    CONSTRAINT UQ_GoodsReceipts_Code UNIQUE (ReceiptCode),
    CONSTRAINT UQ_GoodsReceipts_Ticket UNIQUE (TicketId),
    CONSTRAINT FK_GoodsReceipts_PO FOREIGN KEY (POId) REFERENCES PurchaseOrders(Id),
    CONSTRAINT FK_GoodsReceipts_Ticket FOREIGN KEY (TicketId) REFERENCES InventoryTickets(Id),
    CONSTRAINT FK_GoodsReceipts_ReceivedBy FOREIGN KEY (ReceivedBy) REFERENCES Accounts(Id)
);
GO

CREATE TABLE GoodsReceiptDetails
(
    Id                      BIGINT IDENTITY(1,1) NOT NULL,
    GoodsReceiptId          INT NOT NULL,
    PurchaseOrderDetailId   BIGINT NOT NULL,
    QuantityReceived        INT NOT NULL,
    TicketDetailId          BIGINT NOT NULL,

    CONSTRAINT PK_GoodsReceiptDetails PRIMARY KEY (Id),
    CONSTRAINT FK_GoodsReceiptDetails_Receipt FOREIGN KEY (GoodsReceiptId) REFERENCES GoodsReceipts(Id),
    CONSTRAINT FK_GoodsReceiptDetails_PO_Detail FOREIGN KEY (PurchaseOrderDetailId) REFERENCES PurchaseOrderDetails(Id),
    CONSTRAINT FK_GoodsReceiptDetails_TicketDetail FOREIGN KEY (TicketDetailId) REFERENCES InventoryTicketDetails(Id),
    CONSTRAINT UQ_GoodsReceiptDetails_Receipt_PO_Detail UNIQUE (GoodsReceiptId, PurchaseOrderDetailId),
    CONSTRAINT UQ_GoodsReceiptDetails_TicketDetail UNIQUE (TicketDetailId),
    CONSTRAINT CK_GoodsReceiptDetails_Quantity CHECK (QuantityReceived > 0)
);
GO

/* =========================================================
   5. DỮ LIỆU PHỤC VỤ HỌC MÁY VÀ ĐỀ XUẤT
   ========================================================= */

CREATE TABLE SalesHistory
(
    Id              BIGINT IDENTITY(1,1) NOT NULL,
    ProductId       INT NOT NULL,
    SalesDate       DATE NOT NULL,
    QuantitySold    INT NOT NULL,
    IsHoliday       BIT NOT NULL CONSTRAINT DF_SalesHistory_IsHoliday DEFAULT (0),
    IsPromo         BIT NOT NULL CONSTRAINT DF_SalesHistory_IsPromo DEFAULT (0),
    IsStockOut      BIT NOT NULL CONSTRAINT DF_SalesHistory_IsStockOut DEFAULT (0),

    CONSTRAINT PK_SalesHistory PRIMARY KEY (Id),
    CONSTRAINT FK_SalesHistory_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT UQ_SalesHistory_Product_Date UNIQUE (ProductId, SalesDate),
    CONSTRAINT CK_SalesHistory_Quantity CHECK (QuantitySold >= 0)
);
GO

CREATE TABLE ModelRuns
(
    Id              BIGINT IDENTITY(1,1) NOT NULL,
    ModelName       VARCHAR(100) NOT NULL,
    ModelVersion    VARCHAR(50) NOT NULL,
    TaskType        VARCHAR(30) NOT NULL,
    StartedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_ModelRuns_StartedAt DEFAULT (SYSDATETIME()),
    CompletedAt     DATETIME2(0) NULL,
    Status          VARCHAR(20) NOT NULL CONSTRAINT DF_ModelRuns_Status DEFAULT ('Running'),
    ParametersJson  NVARCHAR(MAX) NULL,
    MetricsJson     NVARCHAR(MAX) NULL,

    CONSTRAINT PK_ModelRuns PRIMARY KEY (Id),
    CONSTRAINT CK_ModelRuns_TaskType CHECK (TaskType IN ('DemandForecast', 'AnomalyDetection')),
    CONSTRAINT CK_ModelRuns_Status CHECK (Status IN ('Running', 'Succeeded', 'Failed')),
    CONSTRAINT CK_ModelRuns_CompletedAt CHECK (CompletedAt IS NULL OR CompletedAt >= StartedAt),
    CONSTRAINT CK_ModelRuns_ParametersJson CHECK (ParametersJson IS NULL OR ISJSON(ParametersJson) = 1),
    CONSTRAINT CK_ModelRuns_MetricsJson CHECK (MetricsJson IS NULL OR ISJSON(MetricsJson) = 1)
);
GO

CREATE TABLE DemandForecasts
(
    Id              BIGINT IDENTITY(1,1) NOT NULL,
    ModelRunId      BIGINT NOT NULL,
    ProductId       INT NOT NULL,
    TargetWeek      DATE NOT NULL,
    ForecastQty     DECIMAL(18,4) NOT NULL,
    LowerBound      DECIMAL(18,4) NULL,
    UpperBound      DECIMAL(18,4) NULL,
    CalculatedAt    DATETIME2(0) NOT NULL CONSTRAINT DF_DemandForecasts_CalculatedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_DemandForecasts PRIMARY KEY (Id),
    CONSTRAINT FK_DemandForecasts_ModelRun FOREIGN KEY (ModelRunId) REFERENCES ModelRuns(Id),
    CONSTRAINT FK_DemandForecasts_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT UQ_DemandForecasts_Run_Product_Week UNIQUE (ModelRunId, ProductId, TargetWeek),
    CONSTRAINT CK_DemandForecasts_ForecastQty CHECK (ForecastQty >= 0),
    CONSTRAINT CK_DemandForecasts_Bounds CHECK
    (
        (LowerBound IS NULL OR LowerBound >= 0)
        AND (UpperBound IS NULL OR UpperBound >= 0)
        AND (LowerBound IS NULL OR UpperBound IS NULL OR LowerBound <= UpperBound)
    )
);
GO

CREATE TABLE OrderRecommendations
(
    Id                          BIGINT IDENTITY(1,1) NOT NULL,
    ModelRunId                  BIGINT NULL,
    ForecastId                  BIGINT NULL,
    ProductId                   INT NOT NULL,
    SuggestedSupplierId         INT NOT NULL,
    SuggestedQuantity           INT NOT NULL,
    SafetyStock                 INT NOT NULL,
    ReorderPoint                DECIMAL(18,4) NOT NULL,
    StockOnHandAtRecommendation INT NOT NULL,
    ReservedQtyAtRecommendation INT NOT NULL,
    OnOrderQtyAtRecommendation  INT NOT NULL,
    LeadTimeDaysUsed            INT NULL,
    Reason                      NVARCHAR(1000) NULL,
    Status                      VARCHAR(20) NOT NULL CONSTRAINT DF_OrderRecommendations_Status DEFAULT ('Pending'),
    CreatedAt                   DATETIME2(0) NOT NULL CONSTRAINT DF_OrderRecommendations_CreatedAt DEFAULT (SYSDATETIME()),
    ReviewedBy                  INT NULL,
    ReviewedAt                  DATETIME2(0) NULL,

    CONSTRAINT PK_OrderRecommendations PRIMARY KEY (Id),
    CONSTRAINT FK_OrderRecommendations_ModelRun FOREIGN KEY (ModelRunId) REFERENCES ModelRuns(Id),
    CONSTRAINT FK_OrderRecommendations_Forecast FOREIGN KEY (ForecastId) REFERENCES DemandForecasts(Id),
    CONSTRAINT FK_OrderRecommendations_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT FK_OrderRecommendations_Suppliers FOREIGN KEY (SuggestedSupplierId) REFERENCES Suppliers(Id),
    CONSTRAINT FK_OrderRecommendations_ReviewedBy FOREIGN KEY (ReviewedBy) REFERENCES Accounts(Id),
    CONSTRAINT CK_OrderRecommendations_Quantities CHECK
    (
        SuggestedQuantity >= 0
        AND SafetyStock >= 0
        AND ReorderPoint >= 0
        AND StockOnHandAtRecommendation >= 0
        AND ReservedQtyAtRecommendation >= 0
        AND OnOrderQtyAtRecommendation >= 0
        AND (LeadTimeDaysUsed IS NULL OR LeadTimeDaysUsed >= 0)
    ),
    CONSTRAINT CK_OrderRecommendations_Status CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Ordered', 'Expired')),
    CONSTRAINT CK_OrderRecommendations_Review CHECK
    (
        (ReviewedBy IS NULL AND ReviewedAt IS NULL)
        OR (ReviewedBy IS NOT NULL AND ReviewedAt IS NOT NULL)
    )
);
GO

CREATE TABLE RecommendationPurchaseOrders
(
    RecommendationId BIGINT NOT NULL,
    PurchaseOrderId  INT NOT NULL,
    LinkedAt         DATETIME2(0) NOT NULL CONSTRAINT DF_RecommendationPurchaseOrders_LinkedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_RecommendationPurchaseOrders PRIMARY KEY (RecommendationId, PurchaseOrderId),
    CONSTRAINT FK_RecommendationPurchaseOrders_Recommendation
        FOREIGN KEY (RecommendationId) REFERENCES OrderRecommendations(Id),
    CONSTRAINT FK_RecommendationPurchaseOrders_PO
        FOREIGN KEY (PurchaseOrderId) REFERENCES PurchaseOrders(Id)
);
GO

CREATE TABLE Anomalies
(
    Id              BIGINT IDENTITY(1,1) NOT NULL,
    ModelRunId      BIGINT NULL,
    ProductId       INT NOT NULL,
    AnomalyType     VARCHAR(50) NOT NULL,
    Severity        VARCHAR(20) NOT NULL CONSTRAINT DF_Anomalies_Severity DEFAULT ('Medium'),
    Description     NVARCHAR(500) NOT NULL,
    DetectedAt      DATETIME2(0) NOT NULL CONSTRAINT DF_Anomalies_DetectedAt DEFAULT (SYSDATETIME()),
    IsResolved      BIT NOT NULL CONSTRAINT DF_Anomalies_IsResolved DEFAULT (0),
    ResolvedAt      DATETIME2(0) NULL,
    ResolutionNote  NVARCHAR(500) NULL,

    CONSTRAINT PK_Anomalies PRIMARY KEY (Id),
    CONSTRAINT FK_Anomalies_ModelRun FOREIGN KEY (ModelRunId) REFERENCES ModelRuns(Id),
    CONSTRAINT FK_Anomalies_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT CK_Anomalies_Severity CHECK (Severity IN ('Low', 'Medium', 'High', 'Critical')),
    CONSTRAINT CK_Anomalies_Resolution CHECK
    (
        (IsResolved = 0 AND ResolvedAt IS NULL)
        OR (IsResolved = 1 AND ResolvedAt IS NOT NULL)
    )
);
GO
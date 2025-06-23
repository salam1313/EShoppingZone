using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EshoppingZoneAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMerchantOrderFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add MerchantId to Products table
            migrationBuilder.AddColumn<string>(
                name: "MerchantId",
                table: "Products",
                type: "nvarchar(9)",
                nullable: false,
                defaultValue: "");

            // Add Status to Orders table
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "Pending");

            // Create index for MerchantId
            migrationBuilder.CreateIndex(
                name: "IX_Products_MerchantId",
                table: "Products",
                column: "MerchantId");

            // Add foreign key relationship
            migrationBuilder.AddForeignKey(
                name: "FK_Products_Users_MerchantId",
                table: "Products",
                column: "MerchantId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Users_MerchantId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_MerchantId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "MerchantId",
                table: "Products");
        }
    }
}

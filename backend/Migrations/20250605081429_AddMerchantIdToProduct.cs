using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EshoppingZoneAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMerchantIdToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ensure MerchantId column exists before altering
            migrationBuilder.AddColumn<string>(
                name: "MerchantId",
                table: "Products",
                type: "nvarchar(9)",
                nullable: true);

            // Now alter the column to be non-nullable with default value
            migrationBuilder.Sql("UPDATE [Products] SET [MerchantId] = '' WHERE [MerchantId] IS NULL;");
            migrationBuilder.AlterColumn<string>(
                name: "MerchantId",
                table: "Products",
                type: "nvarchar(9)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(9)",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "MerchantId",
                table: "Products",
                type: "nvarchar(9)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(9)",
                oldNullable: false);
            migrationBuilder.DropColumn(
                name: "MerchantId",
                table: "Products");
        }
    }
}
